import type { GenerationJob } from "./generation-job";
import type {
  CreatedSpace,
  DueReview,
  SpaceProgress,
  SpaceSummary,
  UploadedSource,
} from "./learning-space";

export type UploadProgressListener = (uploadedFraction: number) => void;

export type IngestionGateway = {
  createSpace(input: {
    title: string;
    description: string;
    sourceType: string;
  }): Promise<CreatedSpace>;

  /**
   * `onUploadProgress` is the one genuine progress signal in this flow: the
   * browser can count bytes on the wire. Everything after this is opaque.
   */
  uploadSource(input: {
    spaceId: string;
    file: File;
    onUploadProgress?: UploadProgressListener;
  }): Promise<UploadedSource>;

  startBlueprintGeneration(spaceId: string): Promise<GenerationJob>;
  getBlueprintGeneration(
    spaceId: string,
    generationId: string,
  ): Promise<GenerationJob>;

  /** All of the user's spaces, or only those matching `query` when given. */
  listSpaces(query?: string): Promise<SpaceSummary[]>;
  listProgress(): Promise<SpaceProgress[]>;
  listDueReviews(): Promise<DueReview[]>;
};
