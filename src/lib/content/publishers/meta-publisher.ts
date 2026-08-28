import { decryptToken } from "@/lib/social/token-encryption";

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface PublishInput {
  accountId: string;
  pageId?: string;
  caption: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  link?: string;
}

export interface PublishResult {
  success: boolean;
  providerPostId?: string;
  error?: string;
  errorCode?: number;
  retryable?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class MetaPublisher {
  async validatePublish(input: PublishInput, tokenEncrypted: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.caption || input.caption.trim().length === 0) {
      errors.push("Caption is required");
    }

    if (input.caption && input.caption.length > 2200) {
      errors.push("Caption exceeds Instagram limit of 2200 characters");
    }

    if (!input.mediaUrl && !input.link) {
      warnings.push("No media URL provided — text-only post may have limited reach");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async publishPost(input: PublishInput, tokenEncrypted: string): Promise<PublishResult> {
    try {
      const accessToken = decryptToken(tokenEncrypted);

      if (input.mediaUrl) {
        return await this.publishWithMedia(input, accessToken);
      }

      return await this.publishTextPost(input, accessToken);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: msg,
        retryable: true,
      };
    }
  }

  private async publishWithMedia(input: PublishInput, accessToken: string): Promise<PublishResult> {
    const containerRes = await fetch(
      `${GRAPH_API_BASE}/${input.accountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: input.mediaUrl,
          caption: input.caption,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerRes.json();

    if (containerData.error) {
      const errCode = containerData.error.code;
      return {
        success: false,
        error: containerData.error.message,
        errorCode: errCode,
        retryable: errCode === 4 || errCode === 190 || containerRes.status >= 500,
      };
    }

    const containerId = containerData.id;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const publishRes = await fetch(
      `${GRAPH_API_BASE}/${input.accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishRes.json();

    if (publishData.error) {
      return {
        success: false,
        error: publishData.error.message,
        errorCode: publishData.error.code,
        retryable: publishData.error.code === 4 || publishRes.status >= 500,
      };
    }

    return {
      success: true,
      providerPostId: publishData.id,
    };
  }

  private async publishTextPost(input: PublishInput, accessToken: string): Promise<PublishResult> {
    const res = await fetch(
      `${GRAPH_API_BASE}/${input.accountId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.caption,
          link: input.link || undefined,
          access_token: accessToken,
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        errorCode: data.error.code,
        retryable: data.error.code === 4 || res.status >= 500,
      };
    }

    return {
      success: true,
      providerPostId: data.id,
    };
  }

  async getPostStatus(postId: string, accessToken: string): Promise<{ exists: boolean; status?: string }> {
    try {
      const res = await fetch(
        `${GRAPH_API_BASE}/${postId}?fields=id,status_code&access_token=${accessToken}`
      );
      const data = await res.json();
      return {
        exists: !data.error,
        status: data.status_code,
      };
    } catch {
      return { exists: false };
    }
  }
}
