import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';

import { Language } from '../../infra/prisma/generated';

import { CallbackDto } from './dtos';
import { ExecutionResultEntity, Judge0Submission } from './entities';
import {
  PRISMA_LANGUAGE_TO_JUDGE0_NAME_PREFIX,
  VERSION_NUMBER_REGEX,
  VERSION_UPDATE_INTERVAL_MS,
} from './judge0.constants';

@Injectable()
export class Judge0Service {
  private judge0Key: string | undefined;
  private judge0Host: string | undefined;
  private judge0CallbackUrl: string | undefined;
  private prismaLanguageToJudge0Language: Map<
    Language,
    { id: number; name: string; lastUpdated: number }
  >;
  private useBatchSubmission = true;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.judge0Key = this.configService.get<string>('JUDGE0_KEY');
    this.judge0Host = this.configService.get<string>('JUDGE0_HOST');
    this.judge0CallbackUrl = this.configService.get<string>(
      'JUDGE0_CALLBACK_URL',
    );
    this.prismaLanguageToJudge0Language = new Map();
  }

  // TODO: Improve this by batching submissions that are sufficiently close together
  async createAsyncSubmission(
    code: string,
    language: Language,
  ): Promise<string | null> {
    if (!this.isFullyInitialised()) {
      return Promise.resolve(null);
    }
    const submission = await this.createSubmissionObject(code, language);
    // We alternate between the two because the quotas for single and batched
    // submissions are separate, and we want to save money T_T.
    this.useBatchSubmission = !this.useBatchSubmission;
    if (this.useBatchSubmission) {
      this.logger.log(
        'Performing batched async submission',
        Judge0Service.name,
      );
      return this.createBatchedSubmission(submission);
    } else {
      this.logger.log('Performing single async submission', Judge0Service.name);
      return this.createSingleSubmission(submission);
    }
  }

  // Used only in development to skip usage of webhooks
  async createSyncSubmission(
    code: string,
    language: Language,
  ): Promise<ExecutionResultEntity | null> {
    if (!this.isFullyInitialised()) {
      return Promise.resolve(null);
    }
    this.logger.log('Performing single sync submission', Judge0Service.name);
    const submission = await this.createSubmissionObject(code, language);
    try {
      const response = await axios.post(
        `https://${this.judge0Host}/submissions`,
        submission,
        {
          params: { base64_encoded: true, wait: true, fields: '*' },
          headers: this.getDefaultHeaders(),
        },
      );
      return this.interpretResults(response.data as CallbackDto);
    } catch (e) {
      this.logger.error(
        'Failed to create sync submission',
        e instanceof Error ? e.stack : undefined,
        Judge0Service.name,
      );
      return null;
    }
  }

  // Returns a map of language to Judge0 language name
  // TODO: Compute and cache it until it gets refreshed.
  async getExecutableLanguages(): Promise<Record<string, string>> {
    await this.refreshLanguagesIfNecessary();
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

  private async createSubmissionObject(
    code: string,
    language: Language,
  ): Promise<Judge0Submission> {
    return {
      language_id: await this.getLanguageId(language),
      source_code: Buffer.from(code, 'utf8').toString('base64'),
      callback_url: this.judge0CallbackUrl,
    };
  }

  private async createSingleSubmission(
    submission: Judge0Submission,
  ): Promise<string | null> {
    try {
      const response = await axios.post<{ token: string }>(
        `https://${this.judge0Host}/submissions`,
        submission,
        {
          params: { base64_encoded: true, wait: false, fields: '*' },
          headers: this.getDefaultHeaders(),
        },
      );
      return response.data.token;
    } catch (e) {
      this.logger.error(
        'Failed to create single submission',
        e instanceof Error ? e.stack : undefined,
        Judge0Service.name,
      );
      return null;
    }
  }

  private async createBatchedSubmission(
    submission: Judge0Submission,
  ): Promise<string | null> {
    try {
      const response = await axios.post<{ token: string }[]>(
        `https://${this.judge0Host}/submissions/batch`,
        { submissions: [submission] },
        {
          params: { base64_encoded: true, wait: false, fields: '*' },
          headers: this.getDefaultHeaders(),
        },
      );
      if (!Array.isArray(response.data) || response.data.length !== 1) {
        return null;
      }
      return response.data[0]?.token ?? null;
    } catch (e) {
      this.logger.error(
        'Failed to create batched submission',
        e instanceof Error ? e.stack : undefined,
        Judge0Service.name,
      );
      return null;
    }
  }

  private async getLanguageId(language: Language): Promise<number | null> {
    await this.refreshLanguagesIfNecessary();
    const id = this.prismaLanguageToJudge0Language.get(language)?.id ?? null;
    if (id == null) {
      this.logger.warn(
        `Failed to find language ID for ${language}`,
        Judge0Service.name,
      );
    }
    return id;
  }

  private async refreshLanguagesIfNecessary(): Promise<void> {
    const keys = Array(...this.prismaLanguageToJudge0Language.keys());
    // They will all have the same lastUpdated, so we'll just check any one
    const keyToCheck = keys[0];
    if (keyToCheck == null) {
      return this.refreshLanguages();
    }
    const lastUpdated =
      this.prismaLanguageToJudge0Language.get(keyToCheck)?.lastUpdated;
    if (lastUpdated && Date.now() - lastUpdated > VERSION_UPDATE_INTERVAL_MS) {
      return this.refreshLanguages();
    }
  }

  private async refreshLanguages(): Promise<void> {
    if (!this.isFullyInitialised()) {
      return;
    }

    this.logger.log('Refreshing languages', Judge0Service.name);
    try {
      const { data }: { data: { id: number; name: string }[] } =
        await axios.get(`https://${this.judge0Host}/languages`, {
          headers: this.getDefaultHeaders(),
        });
      this.prismaLanguageToJudge0Language.clear();
      const matchings = this.matchPrismaLanguageToJudge0Language(data);
      const lastUpdated = Date.now();
      Object.entries(matchings).forEach(([prismaLanguage, judge0Language]) => {
        this.prismaLanguageToJudge0Language.set(prismaLanguage as Language, {
          ...judge0Language,
          lastUpdated,
        });
      });
      this.logger.log('Languages refreshed!', Judge0Service.name);
    } catch (e) {
      this.logger.error(
        'Failed to refresh languages',
        e instanceof Error ? e.stack : undefined,
        Judge0Service.name,
      );
      // no-op, failed to refresh
    }
  }

  // Matches based on the following logic:
  // 1. First, it finds all Judge0 languages with names starting with the prefix defined
  //    in PRISMA_LANGUAGE_TO_JUDGE0_NAME_PREFIX.
  // 2. Second, of the languages from step 1, it selects the one with the highest version
  //    number.
  private matchPrismaLanguageToJudge0Language(
    data: { id: number; name: string }[],
  ): Record<string, { id: number; name: string }> {
    const languages = Object.values(Language);
    const matchings = {};

    languages.forEach((language) => {
      const prefix = PRISMA_LANGUAGE_TO_JUDGE0_NAME_PREFIX[language] as
        | string
        | undefined;
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

  private getDefaultHeaders(): AxiosRequestConfig['headers'] {
    return {
      'content-type': 'application/json',
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': this.judge0Key,
      'X-RapidAPI-Host': this.judge0Host,
    };
  }

  private isFullyInitialised(): boolean {
    const isFullyInitialised =
      this.judge0Key != null &&
      this.judge0Host != null &&
      this.judge0CallbackUrl != null;
    if (!isFullyInitialised) {
      this.logger.warn(
        'Judge0 key, host or callback URL is not defined',
        Judge0Service.name,
      );
    }
    return isFullyInitialised;
  }
}
