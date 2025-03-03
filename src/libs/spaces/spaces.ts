import ServiceFactory from "@/src/services/service-factory/service-factory";
import {
  ZkAppType,
  AppCommonType,
  ExternalAppType,
  SpaceType,
  ZkFormAppType,
  ZkTelegramBotAppType,
} from "./types";
import { AuthType } from "@sismo-core/sismo-connect-server";
import getImgSrcFromConfig from "@/src/utils/getImgSrcFromConfig";

export async function getSpaces(): Promise<SpaceType[]> {
  let spaces: SpaceType[] = [];
  for (let spaceConfig of ServiceFactory.getSpaceConfigs()) {
    let apps: ZkAppType[] = [];
    const spaceProfileImage = await getImgSrcFromConfig({
      configSlug: spaceConfig.metadata.slug,
      fileName: spaceConfig.metadata.image,
    });
    for (let appConfig of spaceConfig.apps) {
      const appImage = await getImgSrcFromConfig({
        configSlug: spaceConfig.metadata.slug,
        fileName: appConfig.metadata.image,
      });
      const appCommon: AppCommonType = {
        name: appConfig.metadata.name,
        slug: appConfig.metadata.slug,
        description: appConfig.metadata.description,
        image: appImage,
        imageFilename: appConfig.metadata.image,
        tags: appConfig.metadata.tags,
        claimRequests: appConfig.sismoConnectRequest.claimRequests,
        authRequests: appConfig.sismoConnectRequest.authRequests,
        impersonateAddresses: appConfig.sismoConnectRequest.impersonateAddresses,
        appId: appConfig.sismoConnectRequest.appId,
        startDate: new Date(appConfig.options?.startDate),
        endDate: new Date(appConfig.options?.endDate),
        disabled: appConfig.options?.disabled,
        createdAt: new Date(appConfig.metadata.createdAt),
        lastUpdateAt: new Date(appConfig.metadata?.lastUpdateAt),
        isFeatured: appConfig.options?.isFeatured,
        space: {
          slug: spaceConfig.metadata.slug,
          name: spaceConfig.metadata.name,
          profileImage: spaceProfileImage,
        },
      };
      if (appConfig.type === "external") {
        apps.push({
          type: appConfig.type,
          ...appCommon,
          link: appConfig.templateConfig.link,
        } as ExternalAppType);
      } else if (appConfig.type === "zkForm") {
        apps.push({
          type: appConfig.type,
          ...appCommon,
          fields: appConfig.templateConfig.fields,
          saveClaims: appConfig.templateConfig.output.saveClaims,
          saveAuths: appConfig.templateConfig.output.saveAuths,
          congratulationsMessage: appConfig.templateConfig.congratulationsMessage,
          failedMessage: appConfig.templateConfig.failedMessage,
          userSelection: appConfig.templateConfig.userSelection,
          output: appConfig.templateConfig.output.destination.type,
          spreadsheetId: appConfig.templateConfig.output.destination.spreadsheetId,
          step1CtaText: appConfig.templateConfig.step1CtaText ?? "Sign in with Sismo",
          step2CtaText: appConfig.templateConfig.step2CtaText,
          appDescription: appConfig.templateConfig.appDescription,
        } as ZkFormAppType);
      } else if (appConfig.type === "zkTelegramBot") {
        apps.push({
          type: appConfig.type,
          ...appCommon,
          authRequests: appConfig.sismoConnectRequest.authRequests ?? [
            { authType: AuthType.TELEGRAM },
          ],
          step1CtaText: appConfig.templateConfig.step1CtaText ?? "Sign in with Sismo",
          step2CtaText: appConfig.templateConfig.step2CtaText,
          appDescription: appConfig.templateConfig.appDescription,
          telegramGroupId: appConfig.templateConfig.telegramGroupId,
          telegramInviteLink: appConfig.templateConfig.telegramInviteLink,
        } as ZkTelegramBotAppType);
      }
    }
    const space: SpaceType = {
      name: spaceConfig.metadata.name,
      slug: spaceConfig.metadata.slug,
      description: spaceConfig.metadata.description,
      profileImage: spaceProfileImage,
      socialLinks: spaceConfig.metadata.socialLinks,
      hidden: spaceConfig.options?.hidden,
      apps: apps,
    };
    spaces.push(space);
  }

  return spaces;
}

export type GetAppsOptions = {
  sortedBy?: "createdAt";
  where?: {
    spaceSlug?: string;
    appSlug?: string;
  };
};

export async function getApps(options?: GetAppsOptions) {
  const spaces = await getSpaces();
  let apps: ZkAppType[] = [];

  for (const space of spaces) {
    for (const app of space.apps) {
      apps.push(app);
    }
  }

  if (options?.sortedBy === "createdAt") {
    apps.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  if (options?.where?.appSlug) {
    apps = apps.filter((app) => app.slug === options?.where?.appSlug);
  }

  if (options?.where?.spaceSlug) {
    apps = apps.filter((app) => app.space.slug === options?.where?.spaceSlug);
  }

  return apps;
}

export async function getSpace({ slug }: { slug?: string } = {}): Promise<SpaceType> {
  const spaces = await getSpaces();
  const selectedSpace = spaces.find((space) => {
    return space.slug === slug;
  });
  return selectedSpace;
}
