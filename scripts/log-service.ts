import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
  FilterLogEventsCommandInput
} from '@aws-sdk/client-cloudwatch-logs';

export class LogService {
  private client: CloudWatchLogsClient;

  constructor(region: string = 'us-east-2') {
    this.client = new CloudWatchLogsClient({ region });
  }

  async fetchLogs(
    logGroupName: string,
    options: {
      startTime?: number;
      limit?: number;
      filterPattern?: string;
      streamPrefix?: string;
    }
  ) {
    const params: FilterLogEventsCommandInput = {
      logGroupName,
      startTime: options.startTime || Date.now() - 1000 * 60 * 60, // Default to 1 hour ago
      limit: options.limit || 100,
      filterPattern: options.filterPattern
    };

    if (options.streamPrefix) {
      params.logStreamNamePrefix = options.streamPrefix;
    }

    try {
      const command = new FilterLogEventsCommand(params);
      const response = await this.client.send(command);
      return response.events || [];
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        throw new Error(`Log group '${logGroupName}' not found.`);
      }
      throw error;
    }
  }

  async tailLogs(
    logGroupName: string,
    options: {
      filterPattern?: string;
      interval?: number;
    }
  ) {
    let lastTimestamp = Date.now() - 1000 * 60 * 5; // Start 5 mins ago
    const interval = options.interval || 5000;

    console.log(`Tailing logs for ${logGroupName}... (Ctrl+C to stop)`);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const events = await this.fetchLogs(logGroupName, {
          startTime: lastTimestamp + 1, // Avoid duplicates
          filterPattern: options.filterPattern
        });

        events.forEach(event => {
          const timestamp = new Date(event.timestamp!).toISOString();
          console.log(`[${timestamp}] ${event.message?.trim()}`);
          if (event.timestamp && event.timestamp > lastTimestamp) {
            lastTimestamp = event.timestamp;
          }
        });
      } catch (error: any) {
        console.error(`Error fetching logs: ${error.message}`);
      }

      // Wait for interval
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}