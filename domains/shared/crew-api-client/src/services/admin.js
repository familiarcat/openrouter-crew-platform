/**
 * Admin Service
 * Administrative operations (export, import, prune, audit reporting)
 */
export class AdminService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    /**
     * Export crew data
     */
    async exportCrewData(crew_id, format = 'json', context) {
        // Retrieve all memories for the crew
        const { data, error } = await this.supabase
            .from('crew_memory_vectors')
            .select('*')
            .eq('crew_id', crew_id);
        if (error) {
            throw new Error(`Export failed: ${error.message}`);
        }
        const memories = (data || []);
        if (format === 'json') {
            return JSON.stringify({
                crew_id,
                exported_at: new Date().toISOString(),
                memory_count: memories.length,
                memories,
            }, null, 2);
        }
        else if (format === 'csv') {
            // Convert to CSV
            const headers = ['ID', 'Content', 'Type', 'Confidence', 'Created At'];
            const rows = memories.map((m) => [
                m.id,
                `"${m.content.replace(/"/g, '""')}"`, // Escape quotes
                m.type,
                m.confidence_level,
                m.created_at,
            ]);
            const csv = [
                headers.join(','),
                ...rows.map((row) => row.join(',')),
            ].join('\n');
            return csv;
        }
        throw new Error(`Unsupported format: ${format}`);
    }
    /**
     * Import crew data
     */
    async importCrewData(file, crew_id, merge = false, context) {
        const content = typeof file === 'string' ? file : file.toString('utf-8');
        let memories = [];
        const errors = [];
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(content);
            memories = parsed.memories || [];
        }
        catch {
            // Try to parse as CSV
            const lines = content.split('\n');
            const headers = lines[0].split(',');
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim())
                    continue;
                const values = lines[i].split(',');
                memories.push({
                    id: values[0],
                    content: values[1]?.replace(/^"|"$/g, ''),
                    type: values[2],
                    confidence_level: parseFloat(values[3]),
                    created_at: values[4],
                });
            }
        }
        if (!merge) {
            // Delete existing memories if not merging
            const { error } = await this.supabase
                .from('crew_memory_vectors')
                .delete()
                .eq('crew_id', crew_id);
            if (error) {
                errors.push(`Failed to clear existing memories: ${error.message}`);
            }
        }
        // Insert new memories
        let imported = 0;
        for (const memory of memories) {
            const { error } = await this.supabase
                .from('crew_memory_vectors')
                .insert({
                crew_id,
                content: memory.content,
                type: memory.type || 'insight',
                confidence_level: memory.confidence_level || 0.5,
                retention_tier: 'standard',
                created_at: memory.created_at || new Date().toISOString(),
            });
            if (error) {
                errors.push(`Failed to import memory: ${error.message}`);
            }
            else {
                imported++;
            }
        }
        return { imported, errors };
    }
    /**
     * Prune expired memories
     */
    async pruneExpiredMemories(crew_id, dry_run = false, context) {
        // Find memories with low confidence (candidates for pruning)
        const { data, error } = await this.supabase
            .from('crew_memory_vectors')
            .select('*')
            .eq('crew_id', crew_id)
            .lt('confidence_level', 0.3); // Low confidence threshold
        if (error) {
            throw new Error(`Prune failed: ${error.message}`);
        }
        const candidates = (data || []);
        if (dry_run) {
            return {
                pruned: candidates.length,
                reason: '[DRY RUN] Would prune low-confidence memories',
            };
        }
        // Soft delete low-confidence memories
        for (const memory of candidates) {
            await this.supabase
                .from('crew_memory_vectors')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', memory.id);
        }
        return {
            pruned: candidates.length,
            reason: 'Pruned low-confidence memories',
        };
    }
    /**
     * Generate audit report
     */
    async generateAuditReport(crew_id, start_date, end_date, context) {
        const { data, error } = await this.supabase
            .from('crew_memory_access_log')
            .select('*')
            .eq('crew_id', crew_id)
            .gte('created_at', start_date)
            .lte('created_at', end_date);
        if (error) {
            throw new Error(`Report generation failed: ${error.message}`);
        }
        const entries = data || [];
        // Count by operation
        const by_operation = {};
        let total_cost = 0;
        entries.forEach((entry) => {
            by_operation[entry.action] = (by_operation[entry.action] || 0) + 1;
            total_cost += entry.cost_estimate || 0;
        });
        const summary = `Generated audit report for crew ${crew_id} ` +
            `with ${entries.length} operations from ${start_date} to ${end_date}. ` +
            `Total cost: $${total_cost.toFixed(4)}`;
        return {
            crew_id,
            period: { start: start_date, end: end_date },
            total_operations: entries.length,
            by_operation,
            total_cost,
            summary,
        };
    }
}
//# sourceMappingURL=admin.js.map