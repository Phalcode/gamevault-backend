import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

import { PaginatedEntity } from "./modules/database/models/paginated-entity.model";

export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(PaginatedEntity, dataDto),
    ApiOkResponse({
      schema: {
        required: ["data", "meta", "links"],
        allOf: [
          {
            properties: {
              data: {
                description: "paginated list of entities",
                type: "array",
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
          { $ref: getSchemaPath(PaginatedEntity) },
        ],
      },
    }),
  );

export default {
  get SUPPORTED_FILE_FORMATS() {
    return [...this.ARCHIVE_FORMATS, ...this.EXECUTABLE_FORMATS];
  },

  LOGGING_FORMAT:
    ":remote-user @ :remote-addr - :method :url -> :status (:response-time ms) - :req[Content-Length] bytes in - :res[Content-Length] bytes out - via :user-agent",
  ARCHIVE_FORMATS: [
    ".7z",
    ".xz",
    ".bz2",
    ".gz",
    ".tar",
    ".zip",
    ".wim",
    ".ar",
    ".arj",
    ".cab",
    ".chm",
    ".cpio",
    ".cramfs",
    ".dmg",
    ".ext",
    ".fat",
    ".gpt",
    ".hfs",
    ".ihex",
    ".iso",
    ".lzh",
    ".lzma",
    ".mbr",
    ".msi",
    ".nsis",
    ".ntfs",
    ".qcow2",
    ".rar",
    ".rpm",
    ".squashfs",
    ".udf",
    ".uefi",
    ".vdi",
    ".vhd",
    ".vmdk",
    ".wim",
    ".xar",
    ".z",
  ],
  EXECUTABLE_FORMATS: [".exe", ".sh", ".appimage"],
  SUPPORTED_MEDIA_FORMATS: [
    "audio/mpeg", // MP3
    "audio/wav", // WAV
    "audio/ogg", // OGG
    "audio/aac", // AAC
    "audio/flac", // FLAC
    "audio/x-ms-wma", // WMA
    "audio/amr", // AMR
    "audio/mp4", // MP4 Audio
    "image/bmp", // BMP
    "image/jpeg", // JPEG
    "image/png", // PNG
    "image/tiff", // TIFF
    "image/gif", // GIF
    "image/x-icon", // ICO
    "video/mp4", // MP4
    "video/x-msvideo", // AVI
    "video/quicktime", // MOV
    "video/x-ms-wmv", // WMV
    "video/x-flv", // FLV
    "video/x-matroska", // MKV
    "video/webm", // WEBM
    "video/mpeg", // MPEG
    "video/3gpp", // 3GP
  ],
  RESERVED_PROVIDER_SLUGS: ["gamevault", "user"],
};

export interface FindOptions {
  /**
   * Fields to select
   */
  select?: string[];

  /**
   * Indicates whether deleted (sub)entities should be loaded. Subentities may
   * be deleted by app-logic afterwards.
   */
  loadDeletedEntities?: boolean;

  /**
   * Indicates whether related entities should be loaded.
   */
  loadRelations?: boolean | string[];

  /**
   * Filter for age restriction purposes.
   */
  filterByAge?: number;
}

export interface GameVaultPluginModule {
  metadata: GameVaultPluginModuleMetadataV1;
}

export interface GameVaultPluginModuleMetadataV1 {
  // Name of the Plugin.
  name: string;
  // Your Name, Email,Username or Company of the author.
  author: string;
  // Version of the Plugin, e.g. "1.0.0".
  version?: string;
  // Describe what the Plugin does and use how to use it.
  description?: string;
  // Website or Github URL of the Plugin.
  website?: string;
  // License Name or License URL of the Plugin.
  license?: string;
  // Some keywords to describe the Plugin.
  keywords?: string[];
  // Dependencies of the Plugin. (Plugins needed to use this Plugin)
  dependencies?: GameVaultPluginModuleMetadataV1[];
}
