export class DeletedEntitiesFilter {
  static filterDeleted(entity: unknown): unknown {
    function filterEntities(obj: unknown): unknown {
      if (Array.isArray(obj)) {
        return obj
          .filter((subEntity) => !subEntity.deleted_at)
          .map((subEntity) => filterEntities(subEntity));
      } else if (obj !== null && typeof obj === "object") {
        return Object.keys(obj).reduce((acc, key) => {
          acc[key] = filterEntities(obj[key]);
          return acc;
        }, {});
      }
      return obj;
    }

    return filterEntities(entity);
  }
}
