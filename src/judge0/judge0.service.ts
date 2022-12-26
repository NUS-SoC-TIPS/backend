import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Language } from '@prisma/client';
import axios, { AxiosRequestConfig } from 'axios';

import { CallbackDto } from './dtos';
import { ExecutionResultEntity } from './entities';
import {
  PRISMA_LANGUAGE_TO_JUDGE0_NAME_PREFIX,
  VERSION_NUMBER_REGEX,
} from './judge0.constants';

@Injectable()
export class Judge0Service {
  private judge0Key: string | undefined;
  private judge0Host: string | undefined;
  private judge0CallbackUrl: string | undefined;
  private prismaLanguageToJudge0Language: Map<
    Language,
    { id: number; name: string }
  >;

  constructor(private readonly configService: ConfigService) {
    this.judge0Key = this.configService.get('JUDGE0_KEY');
    this.judge0Host = this.configService.get('JUDGE0_HOST');
    this.judge0CallbackUrl = this.configService.get('JUDGE0_CALLBACK_URL');
    this.prismaLanguageToJudge0Language = new Map();
  }

  // TODO: Improve this by batching submissions that are sufficiently close together
  async createAsyncSubmission(
    code: string,
    language: Language,
  ): Promise<string | null> {
    const data = await this.createSubmissionHelper(code, language, false);
    if (data == null) {
      return null;
    }
    return data.token as string;
  }

  // Used only in development to skip usage of webhooks
  async createSyncSubmission(
    code: string,
    language: Language,
  ): Promise<ExecutionResultEntity | null> {
    const data = await this.createSubmissionHelper(code, language, true);
    if (data == null) {
      return null;
    }
    return this.interpretResults(data as CallbackDto);
  }

  // Returns a map of language to Judge0 language name
  async getExecutableLanguages(): Promise<{ [language: string]: string }> {
    if (this.prismaLanguageToJudge0Language.size === 0) {
      await this.refreshLanguages();
    }
    const languages = {};
    [...this.prismaLanguageToJudge0Language.entries()].forEach(
      ([key, value]) => (languages[key] = value.name),
    );
    return languages;
  }

  interpretResults(dto: CallbackDto): ExecutionResultEntity {
    const statusDescription = dto.status.description;
    let output = '';
    switch (statusDescription) {
      case 'Accepted':
        output = dto.stdout ?? '';
        break;
      case 'Compilation Error':
        output = dto.compile_output ?? '';
        break;
      case 'Internal Error':
        output = dto.message ?? '';
        break;
      default:
        output = dto.stderr ?? '';
    }
    output = Buffer.from(output, 'base64').toString('utf-8');
    return {
      statusDescription,
      output,
      isError: statusDescription !== 'Accepted',
    };
  }

  private async createSubmissionHelper(
    code: string,
    language: Language,
    wait: boolean,
  ): Promise<any> {
    if (
      this.judge0Key == null ||
      this.judge0Host == null ||
      this.judge0CallbackUrl == null
    ) {
      return Promise.resolve(null);
    }

    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `https://${this.judge0Host}/submissions`,
      params: { base64_encoded: true, wait, fields: '*' },
      headers: {
        'content-type': 'application/json',
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.judge0Key,
        'X-RapidAPI-Host': this.judge0Host,
      },
      data: {
        language_id: await this.getLanguageId(language),
        source_code: Buffer.from(code, 'utf8').toString('base64'),
        callback_url: this.judge0CallbackUrl,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch {
      return null;
    }
  }

  private async getLanguageId(language: Language): Promise<number | null> {
    if (this.prismaLanguageToJudge0Language.size === 0) {
      await this.refreshLanguages();
    }
    return this.prismaLanguageToJudge0Language.get(language)?.id ?? null;
  }

  private async refreshLanguages(): Promise<void> {
    if (this.judge0Key == null || this.judge0Host == null) {
      return;
    }

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `https://${this.judge0Host}/languages`,
      headers: {
        'X-RapidAPI-Key': this.judge0Key,
        'X-RapidAPI-Host': this.judge0Host,
      },
    };

    try {
      const { data }: { data: { id: number; name: string }[] } =
        await axios.request(options);
      this.prismaLanguageToJudge0Language.clear();
      const matchings = this.matchPrismaLanguageToJudge0Language(data);
      Object.entries(matchings).forEach(([prismaLanguage, judge0Language]) => {
        this.prismaLanguageToJudge0Language.set(
          prismaLanguage as Language,
          judge0Language,
        );
      });
    } catch (error) {
      // no-op, failed to refresh
      // TODO: Look into whether there's a need to handle this error
    }
  }

  private matchPrismaLanguageToJudge0Language(
    data: { id: number; name: string }[],
  ): { [language: string]: { id: number; name: string } } {
    const languages = Object.values(Language);
    const matchings = {};

    languages.forEach((language) => {
      const prefix = PRISMA_LANGUAGE_TO_JUDGE0_NAME_PREFIX[language];
      if (prefix == null) {
        return;
      }
      const matchedData = data.filter((d) => d.name.startsWith(prefix));
      if (matchedData.length === 0) {
        return;
      }
      if (matchedData.length === 1) {
        matchings[language] = matchedData[0];
        return;
      }
      const matchedDataWithVersionNumber = matchedData.map((d) => {
        const version = d.name.match(VERSION_NUMBER_REGEX)?.[0];
        return { ...d, version };
      });
      const latestMatchedData = matchedDataWithVersionNumber.reduce((a, b) => {
        if (a.version == null) {
          return b;
        }
        if (b.version == null) {
          return a;
        }
        return a.version.localeCompare(b.version, undefined, {
          numeric: true,
          sensitivity: 'base',
        }) > 0
          ? a
          : b;
      });
      matchings[language] = {
        id: latestMatchedData.id,
        name: latestMatchedData.name,
      };
    });

    return matchings;
  }
}
