#!/bin/bash

################################################################################
# AWS Cost Calculator for OpenRouter Crew Platform
################################################################################
#
# Purpose: Calculate estimated monthly/annual costs for different deployment
#          scenarios, helping with pricing decisions
#
# Usage:
#   bash scripts/aws/cost-calculator.sh
#   bash scripts/aws/cost-calculator.sh --scenario production
#   bash scripts/aws/cost-calculator.sh --verbose
#

set -euo pipefail

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Pricing data (as of 2024, us-east-1)
# Reference: https://aws.amazon.com/pricing/ec2/on-demand/

PRICING_EC2_T3_MICRO="0.0116"      # $/hour
PRICING_EC2_T3_SMALL="0.0208"      # $/hour
PRICING_EC2_T3_MEDIUM="0.0416"     # $/hour
PRICING_EC2_T3_LARGE="0.0832"      # $/hour

PRICING_DATA_TRANSFER_OUT="0.09"    # $/GB (first 1GB free per month)
PRICING_EBS_STORAGE="0.10"          # $/GB/month
PRICING_CLOUDFRONT="0.085"          # $/GB (first 1TB free per month)
PRICING_RDS_MICRO="0.015"           # $/hour
PRICING_RDS_SMALL="0.029"           # $/hour
PRICING_ROUTE53_ZONE="0.50"         # $/month per hosted zone
PRICING_ROUTE53_QUERY="0.40"        # $/million queries
PRICING_ELASTICACHE_CACHE_NODE="0.023"  # $/hour for t3.micro

# Variables
VERBOSE=false
SCENARIO="demo"
HOURS_PER_DAY=24
DAYS_PER_MONTH=30
MONTHLY_REQUESTS=10000

################################################################################
# UTILITY FUNCTIONS
################################################################################

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${CYAN}▶ $1${NC}"
}

print_cost_line() {
    local service=$1
    local monthly=$2
    local annual=$3
    printf "  %-40s $%-10.2f/mo   $%-10.2f/year\n" "$service" "$monthly" "$annual"
}

print_total() {
    local monthly=$1
    local annual=$2
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    printf "  %-40s ${GREEN}\$%-10.2f/mo   \$%-10.2f/year${NC}\n" "TOTAL" "$monthly" "$annual"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Convert to bc format
calc() {
    echo "scale=4; $1" | bc -l
}

# Parse scenario
parse_scenario() {
    case "$1" in
        demo)
            HOURS_PER_DAY=24
            MONTHLY_REQUESTS=1000
            ;;
        startup)
            HOURS_PER_DAY=18
            MONTHLY_REQUESTS=10000
            ;;
        production)
            HOURS_PER_DAY=24
            MONTHLY_REQUESTS=100000
            ;;
        enterprise)
            HOURS_PER_DAY=24
            MONTHLY_REQUESTS=1000000
            ;;
        *)
            echo "Unknown scenario: $1"
            echo "Valid options: demo, startup, production, enterprise"
            exit 1
            ;;
    esac
}

################################################################################
# COST CALCULATION FUNCTIONS
################################################################################

calculate_ec2_cost() {
    local instance_type=$1
    local hours_per_day=$2
    local hours_per_month=$(calc "$hours_per_day * $DAYS_PER_MONTH")

    case "$instance_type" in
        t3.micro)
            local hourly_cost=$PRICING_EC2_T3_MICRO
            ;;
        t3.small)
            local hourly_cost=$PRICING_EC2_T3_SMALL
            ;;
        t3.medium)
            local hourly_cost=$PRICING_EC2_T3_MEDIUM
            ;;
        t3.large)
            local hourly_cost=$PRICING_EC2_T3_LARGE
            ;;
        *)
            echo "Unknown instance type: $instance_type"
            exit 1
            ;;
    esac

    local monthly=$(calc "$hourly_cost * $hours_per_month")
    local annual=$(calc "$monthly * 12")

    echo "$monthly:$annual"
}

calculate_ebs_cost() {
    # Assuming 30GB root volume
    local monthly=$(calc "30 * $PRICING_EBS_STORAGE")
    local annual=$(calc "$monthly * 12")
    echo "$monthly:$annual"
}

calculate_data_transfer_cost() {
    local monthly_requests=$1
    # Assume 50KB average response size
    local monthly_gb=$(calc "$monthly_requests * 0.05 / 1024")
    # First 1GB free
    if (( $(echo "$monthly_gb > 1" | bc -l) )); then
        monthly_gb=$(calc "$monthly_gb - 1")
    else
        monthly_gb=0
    fi

    local monthly=$(calc "$monthly_gb * $PRICING_DATA_TRANSFER_OUT")
    local annual=$(calc "$monthly * 12")
    echo "$monthly:$annual"
}

calculate_cloudfront_cost() {
    # Assume 50% of requests go through CloudFront
    local cf_requests=$1
    local monthly_gb=$(calc "$cf_requests * 0.5 * 0.05 / 1024 / 1000")
    # First 1TB free
    if (( $(echo "$monthly_gb > 1024" | bc -l) )); then
        monthly_gb=$(calc "$monthly_gb - 1024")
    else
        monthly_gb=0
    fi

    local monthly=$(calc "$monthly_gb * $PRICING_CLOUDFRONT")
    local annual=$(calc "$monthly * 12")
    echo "$monthly:$annual"
}

calculate_route53_cost() {
    local zones=$1
    local monthly_queries=$2

    local zone_cost=$(calc "$zones * $PRICING_ROUTE53_ZONE")
    local query_cost=$(calc "$monthly_queries / 1000000 * $PRICING_ROUTE53_QUERY")
    local monthly=$(calc "$zone_cost + $query_cost")
    local annual=$(calc "$monthly * 12")

    echo "$monthly:$annual"
}

calculate_api_cost() {
    local monthly_requests=$1

    # Estimate: 100 tokens per request, $0.001/1K tokens for Haiku
    local monthly_tokens=$(calc "$monthly_requests * 100 / 1000")
    local monthly=$(calc "$monthly_tokens * 0.001")
    local annual=$(calc "$monthly * 12")

    echo "$monthly:$annual"
}

################################################################################
# SCENARIO BUILDERS
################################################################################

calculate_scenario_demo() {
    print_section "SCENARIO: Demo (Learning/POC)"
    echo "  Configuration:"
    echo "    - Instance: t3.micro (9-5 only, auto-shutdown)"
    echo "    - Database: Supabase free tier"
    echo "    - Traffic: 100 requests/month"
    echo ""

    local total_monthly=0
    local total_annual=0

    # EC2 costs (8 hours/day, 20 business days)
    local hours_per_month=$(calc "8 * 20")
    local ec2=$(calc "$PRICING_EC2_T3_MICRO * $hours_per_month")
    print_cost_line "EC2 t3.micro (8h/day, M-F)" "$ec2" "$(calc "$ec2 * 12")"
    total_monthly=$(calc "$total_monthly + $ec2")
    total_annual=$(calc "$total_annual + $ec2 * 12")

    # EBS storage
    local ebs=$(calc "30 * $PRICING_EBS_STORAGE")
    print_cost_line "EBS Storage (30GB)" "$ebs" "$(calc "$ebs * 12")"
    total_monthly=$(calc "$total_monthly + $ebs")
    total_annual=$(calc "$total_annual + $ebs * 12")

    # Route 53
    local route53=$(calc "$PRICING_ROUTE53_ZONE")
    print_cost_line "Route 53 (1 zone, 1K queries)" "$route53" "$(calc "$route53 * 12")"
    total_monthly=$(calc "$total_monthly + $route53")
    total_annual=$(calc "$total_annual + $route53 * 12")

    # Data transfer (negligible for demo)
    print_cost_line "Data Transfer" "0.00" "0.00"

    # API calls
    local api=$(calc "100 * 100 / 1000 * 0.001")
    print_cost_line "OpenRouter API (~100 requests)" "$api" "$(calc "$api * 12")"
    total_monthly=$(calc "$total_monthly + $api")
    total_annual=$(calc "$total_annual + $api * 12")

    print_total "$total_monthly" "$total_annual"

    echo "💡 Break-even analysis:"
    echo "   - Business package revenue: \$1.50 each"
    echo "   - Monthly cost: \$$total_monthly"
    echo "   - Break-even: $(echo "scale=0; $total_monthly / 1.50" | bc -l) executions/month"
    echo "   - 10 executions/month ROI: $(echo "scale=0; (10 * 1.50 / $total_monthly - 1) * 100" | bc -l)%"
}

calculate_scenario_startup() {
    print_section "SCENARIO: Startup (Early Stage)"
    echo "  Configuration:"
    echo "    - Instance: t3.small (18h/day, auto-shutdown 2am-6am)"
    echo "    - Database: Supabase Growth plan"
    echo "    - Traffic: 10,000 requests/month"
    echo ""

    local total_monthly=0
    local total_annual=0

    # EC2 costs (18 hours/day)
    local hours_per_month=$(calc "18 * $DAYS_PER_MONTH")
    local ec2=$(calc "$PRICING_EC2_T3_SMALL * $hours_per_month")
    print_cost_line "EC2 t3.small (18h/day)" "$ec2" "$(calc "$ec2 * 12")"
    total_monthly=$(calc "$total_monthly + $ec2")
    total_annual=$(calc "$total_annual + $ec2 * 12")

    # EBS storage
    local ebs=$(calc "50 * $PRICING_EBS_STORAGE")
    print_cost_line "EBS Storage (50GB)" "$ebs" "$(calc "$ebs * 12")"
    total_monthly=$(calc "$total_monthly + $ebs")
    total_annual=$(calc "$total_annual + $ebs * 12")

    # CloudFront
    local cf_gb=$(calc "10000 * 0.5 * 0.05 / 1024 / 1000")
    local cf=$(calc "$cf_gb * $PRICING_CLOUDFRONT")
    print_cost_line "CloudFront ($cf_gb GB/month)" "$cf" "$(calc "$cf * 12")"
    total_monthly=$(calc "$total_monthly + $cf")
    total_annual=$(calc "$total_annual + $cf * 12")

    # Data transfer
    local dt_gb=$(calc "10000 * 0.05 / 1024 - 1")
    if (( $(echo "$dt_gb < 0" | bc -l) )); then dt_gb=0; fi
    local dt=$(calc "$dt_gb * $PRICING_DATA_TRANSFER_OUT")
    print_cost_line "Data Transfer ($dt_gb GB/month)" "$dt" "$(calc "$dt * 12")"
    total_monthly=$(calc "$total_monthly + $dt")
    total_annual=$(calc "$total_annual + $dt * 12")

    # Route 53
    local route53=$(calc "$PRICING_ROUTE53_ZONE")
    print_cost_line "Route 53" "$route53" "$(calc "$route53 * 12")"
    total_monthly=$(calc "$total_monthly + $route53")
    total_annual=$(calc "$total_annual + $route53 * 12")

    # Supabase Growth plan (approx $50/month)
    print_cost_line "Supabase Growth plan" "50.00" "600.00"
    total_monthly=$(calc "$total_monthly + 50")
    total_annual=$(calc "$total_annual + 50 * 12")

    # API calls
    local api=$(calc "10000 * 100 / 1000 * 0.001")
    print_cost_line "OpenRouter API (~10K requests)" "$api" "$(calc "$api * 12")"
    total_monthly=$(calc "$total_monthly + $api")
    total_annual=$(calc "$total_annual + $api * 12")

    print_total "$total_monthly" "$total_annual"

    echo "💡 Break-even analysis:"
    echo "   - Business package revenue: \$1.50 each"
    echo "   - Monthly cost: \$$total_monthly"
    echo "   - Break-even: $(echo "scale=0; $total_monthly / 1.50" | bc -l) executions/month"
    echo "   - 100 executions/month ROI: $(echo "scale=0; (100 * 1.50 / $total_monthly - 1) * 100" | bc -l)%"
}

calculate_scenario_production() {
    print_section "SCENARIO: Production (Proven PMF)"
    echo "  Configuration:"
    echo "    - Instances: 3x t3.small in Auto Scaling Group"
    echo "    - Database: RDS Multi-AZ"
    echo "    - Cache: ElastiCache"
    echo "    - Traffic: 100,000 requests/month"
    echo ""

    local total_monthly=0
    local total_annual=0

    # EC2 costs (3 instances, 24/7)
    local hours_per_month=$(calc "24 * $DAYS_PER_MONTH")
    local ec2=$(calc "$PRICING_EC2_T3_SMALL * $hours_per_month * 3")
    print_cost_line "EC2 t3.small x3 (24/7)" "$ec2" "$(calc "$ec2 * 12")"
    total_monthly=$(calc "$total_monthly + $ec2")
    total_annual=$(calc "$total_annual + $ec2 * 12")

    # EBS storage
    local ebs=$(calc "100 * $PRICING_EBS_STORAGE")
    print_cost_line "EBS Storage (100GB)" "$ebs" "$(calc "$ebs * 12")"
    total_monthly=$(calc "$total_monthly + $ebs")
    total_annual=$(calc "$total_annual + $ebs * 12")

    # Application Load Balancer (approx $16/month)
    print_cost_line "Application Load Balancer" "16.00" "192.00"
    total_monthly=$(calc "$total_monthly + 16")
    total_annual=$(calc "$total_annual + 16 * 12")

    # CloudFront
    local cf_gb=$(calc "100000 * 0.5 * 0.05 / 1024 / 1000 - 1")
    if (( $(echo "$cf_gb < 0" | bc -l) )); then cf_gb=0; fi
    local cf=$(calc "$cf_gb * $PRICING_CLOUDFRONT")
    print_cost_line "CloudFront ($cf_gb GB/month)" "$cf" "$(calc "$cf * 12")"
    total_monthly=$(calc "$total_monthly + $cf")
    total_annual=$(calc "$total_annual + $cf * 12")

    # Data transfer
    local dt_gb=$(calc "100000 * 0.05 / 1024 - 1")
    if (( $(echo "$dt_gb < 0" | bc -l) )); then dt_gb=0; fi
    local dt=$(calc "$dt_gb * $PRICING_DATA_TRANSFER_OUT")
    print_cost_line "Data Transfer ($dt_gb GB/month)" "$dt" "$(calc "$dt * 12")"
    total_monthly=$(calc "$total_monthly + $dt")
    total_annual=$(calc "$total_annual + $dt * 12")

    # RDS Multi-AZ t3.small (approx $60/month)
    print_cost_line "RDS Multi-AZ t3.small" "60.00" "720.00"
    total_monthly=$(calc "$total_monthly + 60")
    total_annual=$(calc "$total_annual + 60 * 12")

    # ElastiCache (t3.micro node approx $15/month)
    print_cost_line "ElastiCache t3.micro" "15.00" "180.00"
    total_monthly=$(calc "$total_monthly + 15")
    total_annual=$(calc "$total_annual + 15 * 12")

    # Route 53
    local route53=$(calc "$PRICING_ROUTE53_ZONE")
    print_cost_line "Route 53" "$route53" "$(calc "$route53 * 12")"
    total_monthly=$(calc "$total_monthly + $route53")
    total_annual=$(calc "$total_annual + $route53 * 12")

    # Supabase (still using for some purposes, approx $50/month)
    print_cost_line "Supabase Growth plan" "50.00" "600.00"
    total_monthly=$(calc "$total_monthly + 50")
    total_annual=$(calc "$total_annual + 50 * 12")

    # API calls
    local api=$(calc "100000 * 100 / 1000 * 0.001")
    print_cost_line "OpenRouter API (~100K requests)" "$api" "$(calc "$api * 12")"
    total_monthly=$(calc "$total_monthly + $api")
    total_annual=$(calc "$total_annual + $api * 12")

    print_total "$total_monthly" "$total_annual"

    echo "💡 Break-even analysis:"
    echo "   - Business package revenue: \$1.50 each"
    echo "   - Monthly cost: \$$total_monthly"
    echo "   - Break-even: $(echo "scale=0; $total_monthly / 1.50" | bc -l) executions/month"
    echo "   - 10K executions/month ROI: $(echo "scale=0; (10000 * 1.50 / $total_monthly - 1) * 100" | bc -l)%"
}

calculate_scenario_enterprise() {
    print_section "SCENARIO: Enterprise (High Volume)"
    echo "  Configuration:"
    echo "    - Platform: Kubernetes (EKS)"
    echo "    - Nodes: 10x t3.large"
    echo "    - Database: RDS db.r5.large"
    echo "    - Traffic: 1,000,000 requests/month"
    echo ""

    local total_monthly=0
    local total_annual=0

    # EKS cluster (control plane + networking, approx $70/month)
    print_cost_line "EKS Cluster Control Plane" "70.00" "840.00"
    total_monthly=$(calc "$total_monthly + 70")
    total_annual=$(calc "$total_annual + 70 * 12")

    # EC2 costs (10 instances t3.large, 24/7)
    local hours_per_month=$(calc "24 * $DAYS_PER_MONTH")
    local ec2=$(calc "$PRICING_EC2_T3_LARGE * $hours_per_month * 10")
    print_cost_line "EC2 t3.large x10 (24/7, EKS)" "$ec2" "$(calc "$ec2 * 12")"
    total_monthly=$(calc "$total_monthly + $ec2")
    total_annual=$(calc "$total_annual + $ec2 * 12")

    # EBS storage
    local ebs=$(calc "500 * $PRICING_EBS_STORAGE")
    print_cost_line "EBS Storage (500GB)" "$ebs" "$(calc "$ebs * 12")"
    total_monthly=$(calc "$total_monthly + $ebs")
    total_annual=$(calc "$total_annual + $ebs * 12")

    # Network Load Balancer
    print_cost_line "Network Load Balancer" "18.00" "216.00"
    total_monthly=$(calc "$total_monthly + 18")
    total_annual=$(calc "$total_annual + 18 * 12")

    # CloudFront (large traffic)
    local cf_gb=$(calc "1000000 * 0.5 * 0.05 / 1024 / 1000")
    local cf=$(calc "$cf_gb * $PRICING_CLOUDFRONT")
    print_cost_line "CloudFront ($cf_gb GB/month)" "$cf" "$(calc "$cf * 12")"
    total_monthly=$(calc "$total_monthly + $cf")
    total_annual=$(calc "$total_annual + $cf * 12")

    # Data transfer
    local dt_gb=$(calc "1000000 * 0.05 / 1024 / 1000 - 1")
    local dt=$(calc "$dt_gb * $PRICING_DATA_TRANSFER_OUT")
    print_cost_line "Data Transfer ($dt_gb TB/month)" "$dt" "$(calc "$dt * 12")"
    total_monthly=$(calc "$total_monthly + $dt")
    total_annual=$(calc "$total_annual + $dt * 12")

    # RDS Multi-AZ r5.large (approx $250/month)
    print_cost_line "RDS Multi-AZ r5.large" "250.00" "3000.00"
    total_monthly=$(calc "$total_monthly + 250")
    total_annual=$(calc "$total_annual + 250 * 12")

    # ElastiCache cluster (3x r5.large)
    print_cost_line "ElastiCache 3x r5.large" "120.00" "1440.00"
    total_monthly=$(calc "$total_monthly + 120")
    total_annual=$(calc "$total_annual + 120 * 12")

    # Route 53 (custom zones)
    print_cost_line "Route 53 (2 zones)" "1.00" "12.00"
    total_monthly=$(calc "$total_monthly + 1")
    total_annual=$(calc "$total_annual + 1 * 12")

    # AWS support (Business plan minimum)
    print_cost_line "AWS Support (Business)" "100.00" "1200.00"
    total_monthly=$(calc "$total_monthly + 100")
    total_annual=$(calc "$total_annual + 100 * 12")

    # Monitoring (DataDog or New Relic)
    print_cost_line "Monitoring (DataDog)" "75.00" "900.00"
    total_monthly=$(calc "$total_monthly + 75")
    total_annual=$(calc "$total_annual + 75 * 12")

    # API calls (large volume discount)
    local api=$(calc "1000000 * 100 / 1000 * 0.0005")  # 50% discount
    print_cost_line "OpenRouter API (~1M requests)" "$api" "$(calc "$api * 12")"
    total_monthly=$(calc "$total_monthly + $api")
    total_annual=$(calc "$total_annual + $api * 12")

    print_total "$total_monthly" "$total_annual"

    echo "💡 Break-even analysis:"
    echo "   - Business package revenue: \$1.50 each"
    echo "   - Monthly cost: \$$total_monthly"
    echo "   - Break-even: $(echo "scale=0; $total_monthly / 1.50" | bc -l) executions/month"
    echo "   - 100K executions/month ROI: $(echo "scale=0; (100000 * 1.50 / $total_monthly - 1) * 100" | bc -l)%"
}

################################################################################
# MAIN EXECUTION
################################################################################

print_header "OpenRouter Crew Platform - AWS Cost Calculator"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --scenario)
            SCENARIO="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            cat <<EOF
Usage: bash scripts/aws/cost-calculator.sh [OPTIONS]

Options:
  --scenario SCENARIO      Calculate costs for specific scenario
                          Options: demo, startup, production, enterprise
  --verbose               Show detailed breakdown
  --help                  Show this help message

Examples:
  bash scripts/aws/cost-calculator.sh
  bash scripts/aws/cost-calculator.sh --scenario production
  bash scripts/aws/cost-calculator.sh --scenario enterprise --verbose

Scenarios:
  demo        - Single t3.micro, 9-5 schedule, ~100 requests/month (~\$3/month)
  startup     - t3.small, 18h/day, ~10K requests/month (~\$100/month)
  production  - 3x t3.small, 24/7, Multi-AZ, ~100K requests/month (~\$200/month)
  enterprise  - 10x t3.large EKS, RDS Multi-AZ, ~1M requests/month (~\$1500/month)

EOF
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Calculate all scenarios
if [ "$SCENARIO" = "all" ]; then
    calculate_scenario_demo
    calculate_scenario_startup
    calculate_scenario_production
    calculate_scenario_enterprise
else
    case "$SCENARIO" in
        demo)
            calculate_scenario_demo
            ;;
        startup)
            calculate_scenario_startup
            ;;
        production)
            calculate_scenario_production
            ;;
        enterprise)
            calculate_scenario_enterprise
            ;;
        *)
            parse_scenario "$SCENARIO"
            ;;
    esac
fi

# Summary
print_section "COST OPTIMIZATION TIPS"
echo "  1. Enable auto-shutdown outside business hours (save 60%)"
echo "  2. Use CloudFront caching (reduce API calls by 40-60%)"
echo "  3. Implement complexity-based routing (use cheaper models for simple tasks)"
echo "  4. Cache query results (5-min TTL reduces redundant API calls)"
echo "  5. Batch API requests (combine 5+ queries into single call)"
echo "  6. Monitor via CloudWatch (identify optimization opportunities)"
echo "  7. Use Reserved Instances (save 40% on compute costs)"
echo "  8. Set up billing alerts (prevent unexpected costs)"
echo ""

echo -e "${MAGENTA}📊 For more details, see:${NC}"
echo "  - AWS Pricing: https://aws.amazon.com/pricing/"
echo "  - Cost Explorer: https://console.aws.amazon.com/cost-management/"
echo "  - Deployment Guide: ./AWS_DEPLOYMENT_GUIDE.md"
echo ""
