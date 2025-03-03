import configsDemo from "@/.space-configs/demo.json";
import configsMain from "@/.space-configs/main.json";
import { SpaceConfig } from "@/space-configs/types";
import { mockZkFormTestSpaceType } from "@/src/app/api/zk-form/mocks";
import { mockTelegramTestSpaceType } from "@/src/app/api/zk-telegram-bot/mocks";
import env from "@/src/environments";
import { LoggerService } from "@/src/services/logger-service/logger-service";
import { MemoryLogger } from "@/src/services/logger-service/memory-logger-service";
import { StdoutLogger } from "@/src/services/logger-service/stdout-logger-service";
import {
  SismoFactoryMemoryService,
  SismoFactoryService,
} from "@/src/services/sismo-factory-service";
import { SismoFactoryAPIService } from "@/src/services/sismo-factory-service/sismo-factory-api";
import { GoogleSpreadsheetStore, MemoryTableStore, TableStore } from "@/src/services/table-store";
import { MockedTelegramBotService } from "@/src/services/telegram-bot-service/mocked-telegram-bot-service";
import { TelegramAPIBotService } from "@/src/services/telegram-bot-service/telegram-api-bot-service";
import { TelegramBotInterface } from "@/src/services/telegram-bot-service/telegram-bot-service";
import { DemoUserStore } from "@/src/services/user-store/demo-user-store";
import { MemoryUserStore } from "@/src/services/user-store/memory-user-store";
import { PostgresUserStore } from "@/src/services/user-store/postgres-user-store";
import { UserStore } from "@/src/services/user-store/store";

let zkTelegramBotUserStore: UserStore;
let zkFormTableStore: TableStore;
let telegramBotService: TelegramBotInterface;
let configService: SpaceConfig[];
let loggerService: LoggerService;
let sismoFactoryService: SismoFactoryService;

const ServiceFactory = {
  getZkTelegramBotUserStore: (customUserStore?: UserStore): UserStore => {
    if (customUserStore) {
      zkTelegramBotUserStore = customUserStore;
    }
    if (!zkTelegramBotUserStore) {
      if (env.isTest) {
        zkTelegramBotUserStore = new MemoryUserStore();
      } else if (env.isMain) {
        zkTelegramBotUserStore = new PostgresUserStore();
      } else if (env.isDemo) {
        zkTelegramBotUserStore = new DemoUserStore();
      }
    }
    return zkTelegramBotUserStore;
  },
  getZkFormTableStore: (): TableStore => {
    if (!zkFormTableStore) {
      if (env.isTest) {
        zkFormTableStore = new MemoryTableStore();
      } else if (env.isMain || env.isDemo) {
        zkFormTableStore = new GoogleSpreadsheetStore({
          credentials: process.env.ZK_FORM_SPREADSHEET_KEY,
        });
      }
    }
    return zkFormTableStore;
  },
  getLoggerService: (): LoggerService => {
    if (!loggerService) {
      if (env.isTest) {
        loggerService = new MemoryLogger();
      } else {
        loggerService = new StdoutLogger();
      }
    }
    return loggerService;
  },
  getTelegramBotService: (): TelegramBotInterface => {
    if (!telegramBotService) {
      if (env.isTest) {
        telegramBotService = new MockedTelegramBotService();
      } else {
        telegramBotService = new TelegramAPIBotService({
          telegramBotToken: env.telegramBotToken,
          loggerService: ServiceFactory.getLoggerService(),
        });
      }
    }
    return telegramBotService;
  },
  getSpaceConfigs: (customConfigService?: SpaceConfig[]): SpaceConfig[] => {
    if (customConfigService) {
      configService = customConfigService;
    }
    if (!configService) {
      if (env.isDemo) {
        configService = configsDemo as any as SpaceConfig[];
      } else if (env.isMain) {
        configService = configsMain as any as SpaceConfig[];
      } else if (env.isTest) {
        configService = [mockTelegramTestSpaceType(), mockZkFormTestSpaceType()];
      }
    }
    return configService;
  },
  getSismoFactoryService: (): SismoFactoryService => {
    if (!sismoFactoryService) {
      if (env.isTest) {
        sismoFactoryService = new SismoFactoryMemoryService();
      } else {
        sismoFactoryService = new SismoFactoryAPIService({
          url: process.env.SISMO_FACTORY_URL,
          token: process.env.SISMO_FACTORY_TOKEN,
        });
      }
    }
    return sismoFactoryService;
  },
  reset: (): void => {
    configService = null;
    zkTelegramBotUserStore = null;
    telegramBotService = null;
    loggerService = null;
    zkFormTableStore = null;
    sismoFactoryService = null;
  },
};

export default ServiceFactory;
