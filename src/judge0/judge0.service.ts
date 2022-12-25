import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class Judge0Service {
  constructor(private readonly configService: ConfigService) {}

  createSubmission(): Promise<string | null> {
    const judge0Key = this.configService.get('JUDGE0_KEY');
    const judge0Host = this.configService.get('JUDGE0_HOST');
    if (judge0Key == null || judge0Host == null) {
      return Promise.resolve(null);
    }
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `https://${judge0Host}/submissions`,
      params: { base64_encoded: 'true', wait: 'false', fields: '*' },
      headers: {
        'content-type': 'application/json',
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': judge0Key,
        'X-RapidAPI-Host': judge0Host,
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
}
