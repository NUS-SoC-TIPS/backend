import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class Judge0Service {
  private statusIdToDescription: Map<number, string>;
  private judge0Key: string | undefined;
  private judge0Host: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.statusIdToDescription = new Map();
    this.judge0Key = this.configService.get('JUDGE0_KEY');
    this.judge0Host = this.configService.get('JUDGE0_HOST');
  }

  createSubmission(): Promise<string | null> {
    if (this.judge0Key == null || this.judge0Host == null) {
      return Promise.resolve(null);
    }
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `https://${this.judge0Host}/submissions`,
      params: { base64_encoded: 'true', wait: 'false', fields: '*' },
      headers: {
        'content-type': 'application/json',
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.judge0Key,
        'X-RapidAPI-Host': this.judge0Host,
      },
      data: {},
    };

    return axios
      .request(options)
      .then((response) => {
        return response.data.token as string;
      })
      .catch(() => {
        return null;
      });
  }

  private async getStatusDescription(statusId: number): Promise<string> {
    if (this.statusIdToDescription.size === 0) {
      await this.refreshStatuses();
    }
    return this.statusIdToDescription.get(statusId) ?? 'Unknown Error';
  }

  private async refreshStatuses(): Promise<void> {
    if (this.judge0Key == null || this.judge0Host == null) {
      return;
    }

    const options = {
      method: 'GET',
      url: `https://${this.judge0Host}/statuses`,
      headers: {
        'X-RapidAPI-Key': this.judge0Key,
        'X-RapidAPI-Host': this.judge0Host,
      },
    };

    axios
      .request(options)
      .then((response) => {
        this.statusIdToDescription.clear();
        const data: { id: number; description: string }[] = response.data;
        data.forEach(({ id, description }) => {
          this.statusIdToDescription.set(id, description);
        });
      })
      .catch(() => {
        // no-op, failed to refresh
        // TODO: Look into whether there's a need to handle this error
      });
  }
}
