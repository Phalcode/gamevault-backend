import { RawgStore } from "./modules/providers/rawg/models/stores.enum";

export default {
  get SUPPORTED_FILE_FORMATS() {
    return [...this.ARCHIVE_FORMATS, ...this.EXECUTABLE_FORMATS];
  },

  LOGGING_FORMAT:
    "[:date[clf]] :remote-user @ :remote-addr - :method :url -> :status - :response-time ms - :res[content-length] - ':user-agent'",
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
  DEFAULT_INCLUDED_RAWG_STORES: [
    RawgStore["Steam"].toString(),
    RawgStore["Xbox Store"].toString(),
    RawgStore["PlayStation Store"].toString(),
    RawgStore["App Store"].toString(),
    RawgStore["GOG"].toString(),
    RawgStore["Nintendo Store"].toString(),
    RawgStore["Xbox 360 Store"].toString(),
    RawgStore["Google Play"].toString(),
    RawgStore["EPIC Games"].toString(),
  ],
};

export interface FindOptions {
  /**
   * Indicates whether deleted (sub)entities should be loaded.
   *
   * @default false
   */
  loadDeletedEntities: boolean;

  /**
   * Indicates whether related entities should be loaded.
   *
   * @default false
   */
  loadRelations: boolean;
}
