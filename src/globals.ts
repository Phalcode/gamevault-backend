import { RawgPlatform } from "./modules/providers/rawg/models/platforms";
import { RawgStore } from "./modules/providers/rawg/models/stores";

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
  EXECUTABLE_FORMATS: [".exe", ".sh"],
  SUPPORTED_IMAGE_FORMATS: [
    "image/bmp",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/gif",
    "image/x-icon",
  ],
  DEFAULT_INCLUDED_RAWG_STORES: Object.values(RawgStore).filter(
    (platform) =>
      platform !== RawgStore["All Stores"] && platform !== RawgStore["Itch.io"],
  ),
  DEFAULT_INCLUDED_RAWG_PLATFORMS: [RawgPlatform["All Platforms"]],
};

export interface FindOptions {
  /**
   * Indicates whether deleted (sub)entities should be loaded. Subentities may
   * be deleted by app-logic afterwards.
   *
   * @default false
   */
  loadDeletedEntities: boolean;

  /**
   * Indicates whether related entities should be loaded.
   *
   * @default false
   */
  loadRelations: boolean | string[];
}
