import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Language } from '@prisma/client';
import axios, { AxiosRequestConfig } from 'axios';

import {
  PRISMA_LANGUAGE_TO_JUDGE0_NAME_PREFIX,
  VERSION_NUMBER_REGEX,
} from './judge0.constants';

@Injectable()
export class Judge0Service {
  private judge0Key: string | undefined;
  private judge0Host: string | undefined;
  private statusIdToDescription: Map<number, string>;
  private prismaLanguageToJudge0Language: Map<
    Language,
    { id: number; name: string }
  >;

  constructor(private readonly configService: ConfigService) {
    this.judge0Key = this.configService.get('JUDGE0_KEY');
    this.judge0Host = this.configService.get('JUDGE0_HOST');
    this.statusIdToDescription = new Map();
    this.prismaLanguageToJudge0Language = new Map();
  }

  // TODO: Improve this by batching submissions that are sufficiently close together
  async createSubmission(
    code: string,
    language: Language,
  ): Promise<string | null> {
    if (this.judge0Key == null || this.judge0Host == null) {
      return Promise.resolve(null);
    }
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: `https://${this.judge0Host}/submissions`,
      params: { base64_encoded: false, wait: false, fields: '*' },
      headers: {
        'content-type': 'application/json',
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.judge0Key,
        'X-RapidAPI-Host': this.judge0Host,
      },
      data: {
        language_id: await this.getLanguageId(language),
        source_code: code,
      },
    };

    try {
      const {
        data: { token },
      } = await axios.request(options);
      return token as string;
    } catch {
      return null;
    }
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

  private async getLanguageId(language: Language): Promise<number | null> {
    if (this.prismaLanguageToJudge0Language.size === 0) {
      await this.refreshLanguages();
    }
    return this.prismaLanguageToJudge0Language.get(language)?.id ?? null;
  }

  private async getStatusDescription(statusId: number): Promise<string> {
    if (this.statusIdToDescription.size === 0) {
      await this.refreshStatuses();
    }
    return this.statusIdToDescription.get(statusId) ?? 'Unknown Error';
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

  private async refreshStatuses(): Promise<void> {
    if (this.judge0Key == null || this.judge0Host == null) {
      return;
    }

    const options: AxiosRequestConfig = {
      method: 'GET',
      url: `https://${this.judge0Host}/statuses`,
      headers: {
        'X-RapidAPI-Key': this.judge0Key,
        'X-RapidAPI-Host': this.judge0Host,
      },
    };

    try {
      const { data }: { data: { id: number; description: string }[] } =
        await axios.request(options);
      this.statusIdToDescription.clear();
      data.forEach(({ id, description }) => {
        this.statusIdToDescription.set(id, description);
      });
    } catch {
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
