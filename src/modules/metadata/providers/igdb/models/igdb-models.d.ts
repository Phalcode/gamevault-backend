// DO NOT EDIT! This is a generated file. Edit the JSDoc in src/*.js instead and run 'npm run build:types'.

export namespace proto {
  interface ICount {
    count?: number | null;
  }

  class Count implements ICount {
    constructor(properties?: proto.ICount);
    public count: number;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IMultiQueryResult {
    name?: string | null;
    results?: Uint8Array[] | null;
    count?: number | null;
  }

  class MultiQueryResult implements IMultiQueryResult {
    constructor(properties?: proto.IMultiQueryResult);
    public name: string;
    public results: Uint8Array[];
    public count: number;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IMultiQueryResultArray {
    result?: proto.IMultiQueryResult[] | null;
  }

  class MultiQueryResultArray implements IMultiQueryResultArray {
    constructor(properties?: proto.IMultiQueryResultArray);
    public result: proto.IMultiQueryResult[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAgeRatingResult {
    ageratings?: proto.IAgeRating[] | null;
  }

  class AgeRatingResult implements IAgeRatingResult {
    constructor(properties?: proto.IAgeRatingResult);
    public ageratings: proto.IAgeRating[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAgeRating {
    id?: number | null;
    category?: proto.AgeRatingCategoryEnum | null;
    content_descriptions?: proto.IAgeRatingContentDescription[] | null;
    rating?: proto.AgeRatingRatingEnum | null;
    rating_cover_url?: string | null;
    synopsis?: string | null;
    checksum?: string | null;
    organization?: proto.IAgeRatingOrganization | null;
    rating_category?: proto.IAgeRatingCategory | null;
    rating_content_descriptions?: proto.IAgeRatingContentDescriptionV2[] | null;
  }

  class AgeRating implements IAgeRating {
    constructor(properties?: proto.IAgeRating);
    public id: number;
    public category: proto.AgeRatingCategoryEnum;
    public content_descriptions: proto.IAgeRatingContentDescription[];
    public rating: proto.AgeRatingRatingEnum;
    public rating_cover_url: string;
    public synopsis: string;
    public checksum: string;
    public organization?: proto.IAgeRatingOrganization | null;
    public rating_category?: proto.IAgeRatingCategory | null;
    public rating_content_descriptions: proto.IAgeRatingContentDescriptionV2[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum AgeRatingCategoryEnum {
    AGERATING_CATEGORY_NULL = 0,
    ESRB = 1,
    PEGI = 2,
    CERO = 3,
    USK = 4,
    GRAC = 5,
    CLASS_IND = 6,
    ACB = 7,
  }

  enum AgeRatingRatingEnum {
    AGERATING_RATING_NULL = 0,
    THREE = 1,
    SEVEN = 2,
    TWELVE = 3,
    SIXTEEN = 4,
    EIGHTEEN = 5,
    RP = 6,
    EC = 7,
    E = 8,
    E10 = 9,
    T = 10,
    M = 11,
    AO = 12,
    CERO_A = 13,
    CERO_B = 14,
    CERO_C = 15,
    CERO_D = 16,
    CERO_Z = 17,
    USK_0 = 18,
    USK_6 = 19,
    USK_12 = 20,
    USK_16 = 21,
    USK_18 = 22,
    GRAC_ALL = 23,
    GRAC_TWELVE = 24,
    GRAC_FIFTEEN = 25,
    GRAC_EIGHTEEN = 26,
    GRAC_TESTING = 27,
    CLASS_IND_L = 28,
    CLASS_IND_TEN = 29,
    CLASS_IND_TWELVE = 30,
    CLASS_IND_FOURTEEN = 31,
    CLASS_IND_SIXTEEN = 32,
    CLASS_IND_EIGHTEEN = 33,
    ACB_G = 34,
    ACB_PG = 35,
    ACB_M = 36,
    ACB_MA15 = 37,
    ACB_R18 = 38,
    ACB_RC = 39,
  }

  interface IAgeRatingCategoryResult {
    ageratingcategories?: proto.IAgeRatingCategory[] | null;
  }

  class AgeRatingCategoryResult implements IAgeRatingCategoryResult {
    constructor(properties?: proto.IAgeRatingCategoryResult);
    public ageratingcategories: proto.IAgeRatingCategory[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAgeRatingCategory {
    id?: number | null;
    rating?: string | null;
    organization?: proto.IAgeRatingOrganization | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class AgeRatingCategory implements IAgeRatingCategory {
    constructor(properties?: proto.IAgeRatingCategory);
    public id: number;
    public rating: string;
    public organization?: proto.IAgeRatingOrganization | null;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAgeRatingContentDescriptionResult {
    ageratingcontentdescriptions?: proto.IAgeRatingContentDescription[] | null;
  }

  class AgeRatingContentDescriptionResult
    implements IAgeRatingContentDescriptionResult
  {
    constructor(properties?: proto.IAgeRatingContentDescriptionResult);
    public ageratingcontentdescriptions: proto.IAgeRatingContentDescription[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAgeRatingContentDescription {
    id?: number | null;
    category?: proto.AgeRatingContentDescriptionCategoryEnum | null;
    description?: string | null;
    checksum?: string | null;
  }

  class AgeRatingContentDescription implements IAgeRatingContentDescription {
    constructor(properties?: proto.IAgeRatingContentDescription);
    public id: number;
    public category: proto.AgeRatingContentDescriptionCategoryEnum;
    public description: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum AgeRatingContentDescriptionCategoryEnum {
    AGERATINGCONTENTDESCRIPTION_CATEGORY_NULL = 0,
    ESRB_ALCOHOL_REFERENCE = 1,
    ESRB_ANIMATED_BLOOD = 2,
    ESRB_BLOOD = 3,
    ESRB_BLOOD_AND_GORE = 4,
    ESRB_CARTOON_VIOLENCE = 5,
    ESRB_COMIC_MISCHIEF = 6,
    ESRB_CRUDE_HUMOR = 7,
    ESRB_DRUG_REFERENCE = 8,
    ESRB_FANTASY_VIOLENCE = 9,
    ESRB_INTENSE_VIOLENCE = 10,
    ESRB_LANGUAGE = 11,
    ESRB_LYRICS = 12,
    ESRB_MATURE_HUMOR = 13,
    ESRB_NUDITY = 14,
    ESRB_PARTIAL_NUDITY = 15,
    ESRB_REAL_GAMBLING = 16,
    ESRB_SEXUAL_CONTENT = 17,
    ESRB_SEXUAL_THEMES = 18,
    ESRB_SEXUAL_VIOLENCE = 19,
    ESRB_SIMULATED_GAMBLING = 20,
    ESRB_STRONG_LANGUAGE = 21,
    ESRB_STRONG_LYRICS = 22,
    ESRB_STRONG_SEXUAL_CONTENT = 23,
    ESRB_SUGGESTIVE_THEMES = 24,
    ESRB_TOBACCO_REFERENCE = 25,
    ESRB_USE_OF_ALCOHOL = 26,
    ESRB_USE_OF_DRUGS = 27,
    ESRB_USE_OF_TOBACCO = 28,
    ESRB_VIOLENCE = 29,
    ESRB_VIOLENT_REFERENCES = 30,
    ESRB_ANIMATED_VIOLENCE = 31,
    ESRB_MILD_LANGUAGE = 32,
    ESRB_MILD_VIOLENCE = 33,
    ESRB_USE_OF_DRUGS_AND_ALCOHOL = 34,
    ESRB_DRUG_AND_ALCOHOL_REFERENCE = 35,
    ESRB_MILD_SUGGESTIVE_THEMES = 36,
    ESRB_MILD_CARTOON_VIOLENCE = 37,
    ESRB_MILD_BLOOD = 38,
    ESRB_REALISTIC_BLOOD_AND_GORE = 39,
    ESRB_REALISTIC_VIOLENCE = 40,
    ESRB_ALCOHOL_AND_TOBACCO_REFERENCE = 41,
    ESRB_MATURE_SEXUAL_THEMES = 42,
    ESRB_MILD_ANIMATED_VIOLENCE = 43,
    ESRB_MILD_SEXUAL_THEMES = 44,
    ESRB_USE_OF_ALCOHOL_AND_TOBACCO = 45,
    ESRB_ANIMATED_BLOOD_AND_GORE = 46,
    ESRB_MILD_FANTASY_VIOLENCE = 47,
    ESRB_MILD_LYRICS = 48,
    ESRB_REALISTIC_BLOOD = 49,
    PEGI_VIOLENCE = 50,
    PEGI_SEX = 51,
    PEGI_DRUGS = 52,
    PEGI_FEAR = 53,
    PEGI_DISCRIMINATION = 54,
    PEGI_BAD_LANGUAGE = 55,
    PEGI_GAMBLING = 56,
    PEGI_ONLINE_GAMEPLAY = 57,
    PEGI_IN_GAME_PURCHASES = 58,
    CERO_LOVE = 59,
    CERO_SEXUAL_CONTENT = 60,
    CERO_VIOLENCE = 61,
    CERO_HORROR = 62,
    CERO_DRINKING_SMOKING = 63,
    CERO_GAMBLING = 64,
    CERO_CRIME = 65,
    CERO_CONTROLLED_SUBSTANCES = 66,
    CERO_LANGUAGES_AND_OTHERS = 67,
    GRAC_SEXUALITY = 68,
    GRAC_VIOLENCE = 69,
    GRAC_FEAR_HORROR_THREATENING = 70,
    GRAC_LANGUAGE = 71,
    GRAC_ALCOHOL_TOBACCO_DRUG = 72,
    GRAC_CRIME_ANTI_SOCIAL = 73,
    GRAC_GAMBLING = 74,
    CLASS_IND_VIOLENCIA = 75,
    CLASS_IND_VIOLENCIA_EXTREMA = 76,
    CLASS_IND_CONTEUDO_SEXUAL = 77,
    CLASS_IND_NUDEZ = 78,
    CLASS_IND_SEXO = 79,
    CLASS_IND_SEXO_EXPLICITO = 80,
    CLASS_IND_DROGAS = 81,
    CLASS_IND_DROGAS_LICITAS = 82,
    CLASS_IND_DROGAS_ILICITAS = 83,
    CLASS_IND_LINGUAGEM_IMPROPRIA = 84,
    CLASS_IND_ATOS_CRIMINOSOS = 85,
  }

  interface IAgeRatingContentDescriptionV2Result {
    ageratingcontentdescriptionsv2?:
      | proto.IAgeRatingContentDescriptionV2[]
      | null;
  }

  class AgeRatingContentDescriptionV2Result
    implements IAgeRatingContentDescriptionV2Result
  {
    constructor(properties?: proto.IAgeRatingContentDescriptionV2Result);
    public ageratingcontentdescriptionsv2: proto.IAgeRatingContentDescriptionV2[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAgeRatingContentDescriptionV2 {
    id?: number | null;
    description?: string | null;
    organization?: proto.IAgeRatingOrganization | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class AgeRatingContentDescriptionV2
    implements IAgeRatingContentDescriptionV2
  {
    constructor(properties?: proto.IAgeRatingContentDescriptionV2);
    public id: number;
    public description: string;
    public organization?: proto.IAgeRatingOrganization | null;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAgeRatingOrganizationResult {
    ageratingorganizations?: proto.IAgeRatingOrganization[] | null;
  }

  class AgeRatingOrganizationResult implements IAgeRatingOrganizationResult {
    constructor(properties?: proto.IAgeRatingOrganizationResult);
    public ageratingorganizations: proto.IAgeRatingOrganization[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAgeRatingOrganization {
    id?: number | null;
    name?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class AgeRatingOrganization implements IAgeRatingOrganization {
    constructor(properties?: proto.IAgeRatingOrganization);
    public id: number;
    public name: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAlternativeNameResult {
    alternativenames?: proto.IAlternativeName[] | null;
  }

  class AlternativeNameResult implements IAlternativeNameResult {
    constructor(properties?: proto.IAlternativeNameResult);
    public alternativenames: proto.IAlternativeName[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IAlternativeName {
    id?: number | null;
    comment?: string | null;
    game?: proto.IGame | null;
    name?: string | null;
    checksum?: string | null;
  }

  class AlternativeName implements IAlternativeName {
    constructor(properties?: proto.IAlternativeName);
    public id: number;
    public comment: string;
    public game?: proto.IGame | null;
    public name: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IArtworkResult {
    artworks?: proto.IArtwork[] | null;
  }

  class ArtworkResult implements IArtworkResult {
    constructor(properties?: proto.IArtworkResult);
    public artworks: proto.IArtwork[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IArtwork {
    id?: number | null;
    alpha_channel?: boolean | null;
    animated?: boolean | null;
    game?: proto.IGame | null;
    height?: number | null;
    image_id?: string | null;
    url?: string | null;
    width?: number | null;
    checksum?: string | null;
  }

  class Artwork implements IArtwork {
    constructor(properties?: proto.IArtwork);
    public id: number;
    public alpha_channel: boolean;
    public animated: boolean;
    public game?: proto.IGame | null;
    public height: number;
    public image_id: string;
    public url: string;
    public width: number;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICharacterResult {
    characters?: proto.ICharacter[] | null;
  }

  class CharacterResult implements ICharacterResult {
    constructor(properties?: proto.ICharacterResult);
    public characters: proto.ICharacter[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICharacter {
    id?: number | null;
    akas?: string[] | null;
    country_name?: string | null;
    created_at?: number | null;
    description?: string | null;
    games?: proto.IGame[] | null;
    gender?: proto.GenderGenderEnum | null;
    mug_shot?: proto.ICharacterMugShot | null;
    name?: string | null;
    slug?: string | null;
    species?: proto.CharacterSpeciesEnum | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
    character_gender?: proto.ICharacterGender | null;
    character_species?: proto.ICharacterSpecie | null;
  }

  class Character implements ICharacter {
    constructor(properties?: proto.ICharacter);
    public id: number;
    public akas: string[];
    public country_name: string;
    public created_at?: number | null;
    public description: string;
    public games: proto.IGame[];
    public gender: proto.GenderGenderEnum;
    public mug_shot?: proto.ICharacterMugShot | null;
    public name: string;
    public slug: string;
    public species: proto.CharacterSpeciesEnum;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public character_gender?: proto.ICharacterGender | null;
    public character_species?: proto.ICharacterSpecie | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum GenderGenderEnum {
    MALE = 0,
    FEMALE = 1,
    OTHER = 2,
  }

  enum CharacterSpeciesEnum {
    CHARACTER_SPECIES_NULL = 0,
    HUMAN = 1,
    ALIEN = 2,
    ANIMAL = 3,
    ANDROID = 4,
    UNKNOWN = 5,
  }

  interface ICharacterGenderResult {
    charactergenders?: proto.ICharacterGender[] | null;
  }

  class CharacterGenderResult implements ICharacterGenderResult {
    constructor(properties?: proto.ICharacterGenderResult);
    public charactergenders: proto.ICharacterGender[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICharacterGender {
    id?: number | null;
    name?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class CharacterGender implements ICharacterGender {
    constructor(properties?: proto.ICharacterGender);
    public id: number;
    public name: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICharacterMugShotResult {
    charactermugshots?: proto.ICharacterMugShot[] | null;
  }

  class CharacterMugShotResult implements ICharacterMugShotResult {
    constructor(properties?: proto.ICharacterMugShotResult);
    public charactermugshots: proto.ICharacterMugShot[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICharacterMugShot {
    id?: number | null;
    alpha_channel?: boolean | null;
    animated?: boolean | null;
    height?: number | null;
    image_id?: string | null;
    url?: string | null;
    width?: number | null;
    checksum?: string | null;
  }

  class CharacterMugShot implements ICharacterMugShot {
    constructor(properties?: proto.ICharacterMugShot);
    public id: number;
    public alpha_channel: boolean;
    public animated: boolean;
    public height: number;
    public image_id: string;
    public url: string;
    public width: number;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICharacterSpecieResult {
    characterspecies?: proto.ICharacterSpecie[] | null;
  }

  class CharacterSpecieResult implements ICharacterSpecieResult {
    constructor(properties?: proto.ICharacterSpecieResult);
    public characterspecies: proto.ICharacterSpecie[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICharacterSpecie {
    id?: number | null;
    name?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class CharacterSpecie implements ICharacterSpecie {
    constructor(properties?: proto.ICharacterSpecie);
    public id: number;
    public name: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionResult {
    collections?: proto.ICollection[] | null;
  }

  class CollectionResult implements ICollectionResult {
    constructor(properties?: proto.ICollectionResult);
    public collections: proto.ICollection[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollection {
    id?: number | null;
    created_at?: number | null;
    games?: proto.IGame[] | null;
    name?: string | null;
    slug?: string | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
    type?: proto.ICollectionType | null;
    as_parent_relations?: proto.ICollectionRelation[] | null;
    as_child_relations?: proto.ICollectionRelation[] | null;
  }

  class Collection implements ICollection {
    constructor(properties?: proto.ICollection);
    public id: number;
    public created_at?: number | null;
    public games: proto.IGame[];
    public name: string;
    public slug: string;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public type?: proto.ICollectionType | null;
    public as_parent_relations: proto.ICollectionRelation[];
    public as_child_relations: proto.ICollectionRelation[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionMembershipResult {
    collectionmemberships?: proto.ICollectionMembership[] | null;
  }

  class CollectionMembershipResult implements ICollectionMembershipResult {
    constructor(properties?: proto.ICollectionMembershipResult);
    public collectionmemberships: proto.ICollectionMembership[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionMembership {
    id?: number | null;
    game?: proto.IGame | null;
    collection?: proto.ICollection | null;
    type?: proto.ICollectionMembershipType | null;
    updated_at?: number | null;
    created_at?: number | null;
    checksum?: string | null;
  }

  class CollectionMembership implements ICollectionMembership {
    constructor(properties?: proto.ICollectionMembership);
    public id: number;
    public game?: proto.IGame | null;
    public collection?: proto.ICollection | null;
    public type?: proto.ICollectionMembershipType | null;
    public updated_at?: number | null;
    public created_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionMembershipTypeResult {
    collectionmembershiptypes?: proto.ICollectionMembershipType[] | null;
  }

  class CollectionMembershipTypeResult
    implements ICollectionMembershipTypeResult
  {
    constructor(properties?: proto.ICollectionMembershipTypeResult);
    public collectionmembershiptypes: proto.ICollectionMembershipType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionMembershipType {
    id?: number | null;
    name?: string | null;
    description?: string | null;
    allowed_collection_type?: proto.ICollectionType | null;
    updated_at?: number | null;
    created_at?: number | null;
    checksum?: string | null;
  }

  class CollectionMembershipType implements ICollectionMembershipType {
    constructor(properties?: proto.ICollectionMembershipType);
    public id: number;
    public name: string;
    public description: string;
    public allowed_collection_type?: proto.ICollectionType | null;
    public updated_at?: number | null;
    public created_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionRelationResult {
    collectionrelations?: proto.ICollectionRelation[] | null;
  }

  class CollectionRelationResult implements ICollectionRelationResult {
    constructor(properties?: proto.ICollectionRelationResult);
    public collectionrelations: proto.ICollectionRelation[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionRelation {
    id?: number | null;
    child_collection?: proto.ICollection | null;
    parent_collection?: proto.ICollection | null;
    type?: proto.ICollectionRelationType | null;
    updated_at?: number | null;
    created_at?: number | null;
    checksum?: string | null;
  }

  class CollectionRelation implements ICollectionRelation {
    constructor(properties?: proto.ICollectionRelation);
    public id: number;
    public child_collection?: proto.ICollection | null;
    public parent_collection?: proto.ICollection | null;
    public type?: proto.ICollectionRelationType | null;
    public updated_at?: number | null;
    public created_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionRelationTypeResult {
    collectionrelationtypes?: proto.ICollectionRelationType[] | null;
  }

  class CollectionRelationTypeResult implements ICollectionRelationTypeResult {
    constructor(properties?: proto.ICollectionRelationTypeResult);
    public collectionrelationtypes: proto.ICollectionRelationType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionRelationType {
    id?: number | null;
    name?: string | null;
    description?: string | null;
    allowed_child_type?: proto.ICollectionType | null;
    allowed_parent_type?: proto.ICollectionType | null;
    updated_at?: number | null;
    created_at?: number | null;
    checksum?: string | null;
  }

  class CollectionRelationType implements ICollectionRelationType {
    constructor(properties?: proto.ICollectionRelationType);
    public id: number;
    public name: string;
    public description: string;
    public allowed_child_type?: proto.ICollectionType | null;
    public allowed_parent_type?: proto.ICollectionType | null;
    public updated_at?: number | null;
    public created_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionTypeResult {
    collectiontypes?: proto.ICollectionType[] | null;
  }

  class CollectionTypeResult implements ICollectionTypeResult {
    constructor(properties?: proto.ICollectionTypeResult);
    public collectiontypes: proto.ICollectionType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICollectionType {
    id?: number | null;
    name?: string | null;
    description?: string | null;
    updated_at?: number | null;
    created_at?: number | null;
    checksum?: string | null;
  }

  class CollectionType implements ICollectionType {
    constructor(properties?: proto.ICollectionType);
    public id: number;
    public name: string;
    public description: string;
    public updated_at?: number | null;
    public created_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICompanyResult {
    companies?: proto.ICompany[] | null;
  }

  class CompanyResult implements ICompanyResult {
    constructor(properties?: proto.ICompanyResult);
    public companies: proto.ICompany[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICompany {
    id?: number | null;
    change_date?: number | null;
    change_date_category?: proto.DateFormatChangeDateCategoryEnum | null;
    changed_company_id?: proto.ICompany | null;
    country?: number | null;
    created_at?: number | null;
    description?: string | null;
    developed?: proto.IGame[] | null;
    logo?: proto.ICompanyLogo | null;
    name?: string | null;
    parent?: proto.ICompany | null;
    published?: proto.IGame[] | null;
    slug?: string | null;
    start_date?: number | null;
    start_date_category?: proto.DateFormatChangeDateCategoryEnum | null;
    updated_at?: number | null;
    url?: string | null;
    websites?: proto.ICompanyWebsite[] | null;
    checksum?: string | null;
    status?: proto.ICompanyStatus | null;
    start_date_format?: proto.IDateFormat | null;
    change_date_format?: proto.IDateFormat | null;
  }

  class Company implements ICompany {
    constructor(properties?: proto.ICompany);
    public id: number;
    public change_date?: number | null;
    public change_date_category: proto.DateFormatChangeDateCategoryEnum;
    public changed_company_id?: proto.ICompany | null;
    public country: number;
    public created_at?: number | null;
    public description: string;
    public developed: proto.IGame[];
    public logo?: proto.ICompanyLogo | null;
    public name: string;
    public parent?: proto.ICompany | null;
    public published: proto.IGame[];
    public slug: string;
    public start_date?: number | null;
    public start_date_category: proto.DateFormatChangeDateCategoryEnum;
    public updated_at?: number | null;
    public url: string;
    public websites: proto.ICompanyWebsite[];
    public checksum: string;
    public status?: proto.ICompanyStatus | null;
    public start_date_format?: proto.IDateFormat | null;
    public change_date_format?: proto.IDateFormat | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum DateFormatChangeDateCategoryEnum {
    YYYYMMMMDD = 0,
    YYYYMMMM = 1,
    YYYY = 2,
    YYYYQ1 = 3,
    YYYYQ2 = 4,
    YYYYQ3 = 5,
    YYYYQ4 = 6,
    TBD = 7,
  }

  interface ICompanyLogoResult {
    companylogos?: proto.ICompanyLogo[] | null;
  }

  class CompanyLogoResult implements ICompanyLogoResult {
    constructor(properties?: proto.ICompanyLogoResult);
    public companylogos: proto.ICompanyLogo[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICompanyLogo {
    id?: number | null;
    alpha_channel?: boolean | null;
    animated?: boolean | null;
    height?: number | null;
    image_id?: string | null;
    url?: string | null;
    width?: number | null;
    checksum?: string | null;
  }

  class CompanyLogo implements ICompanyLogo {
    constructor(properties?: proto.ICompanyLogo);
    public id: number;
    public alpha_channel: boolean;
    public animated: boolean;
    public height: number;
    public image_id: string;
    public url: string;
    public width: number;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICompanyStatusResult {
    companystatuses?: proto.ICompanyStatus[] | null;
  }

  class CompanyStatusResult implements ICompanyStatusResult {
    constructor(properties?: proto.ICompanyStatusResult);
    public companystatuses: proto.ICompanyStatus[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICompanyStatus {
    id?: number | null;
    name?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class CompanyStatus implements ICompanyStatus {
    constructor(properties?: proto.ICompanyStatus);
    public id: number;
    public name: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICompanyWebsiteResult {
    companywebsites?: proto.ICompanyWebsite[] | null;
  }

  class CompanyWebsiteResult implements ICompanyWebsiteResult {
    constructor(properties?: proto.ICompanyWebsiteResult);
    public companywebsites: proto.ICompanyWebsite[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICompanyWebsite {
    id?: number | null;
    category?: proto.WebsiteCategoryEnum | null;
    trusted?: boolean | null;
    url?: string | null;
    checksum?: string | null;
    type?: proto.IWebsiteType | null;
  }

  class CompanyWebsite implements ICompanyWebsite {
    constructor(properties?: proto.ICompanyWebsite);
    public id: number;
    public category: proto.WebsiteCategoryEnum;
    public trusted: boolean;
    public url: string;
    public checksum: string;
    public type?: proto.IWebsiteType | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum WebsiteCategoryEnum {
    WEBSITE_CATEGORY_NULL = 0,
    WEBSITE_OFFICIAL = 1,
    WEBSITE_WIKIA = 2,
    WEBSITE_WIKIPEDIA = 3,
    WEBSITE_FACEBOOK = 4,
    WEBSITE_TWITTER = 5,
    WEBSITE_TWITCH = 6,
    WEBSITE_INSTAGRAM = 8,
    WEBSITE_YOUTUBE = 9,
    WEBSITE_IPHONE = 10,
    WEBSITE_IPAD = 11,
    WEBSITE_ANDROID = 12,
    WEBSITE_STEAM = 13,
    WEBSITE_REDDIT = 14,
    WEBSITE_ITCH = 15,
    WEBSITE_EPICGAMES = 16,
    WEBSITE_GOG = 17,
    WEBSITE_DISCORD = 18,
    WEBSITE_BLUESKY = 19,
  }

  interface ICoverResult {
    covers?: proto.ICover[] | null;
  }

  class CoverResult implements ICoverResult {
    constructor(properties?: proto.ICoverResult);
    public covers: proto.ICover[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ICover {
    id?: number | null;
    alpha_channel?: boolean | null;
    animated?: boolean | null;
    game?: proto.IGame | null;
    height?: number | null;
    image_id?: string | null;
    url?: string | null;
    width?: number | null;
    checksum?: string | null;
    game_localization?: proto.IGameLocalization | null;
  }

  class Cover implements ICover {
    constructor(properties?: proto.ICover);
    public id: number;
    public alpha_channel: boolean;
    public animated: boolean;
    public game?: proto.IGame | null;
    public height: number;
    public image_id: string;
    public url: string;
    public width: number;
    public checksum: string;
    public game_localization?: proto.IGameLocalization | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IDateFormatResult {
    dateformats?: proto.IDateFormat[] | null;
  }

  class DateFormatResult implements IDateFormatResult {
    constructor(properties?: proto.IDateFormatResult);
    public dateformats: proto.IDateFormat[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IDateFormat {
    id?: number | null;
    format?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class DateFormat implements IDateFormat {
    constructor(properties?: proto.IDateFormat);
    public id: number;
    public format: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IEventResult {
    events?: proto.IEvent[] | null;
  }

  class EventResult implements IEventResult {
    constructor(properties?: proto.IEventResult);
    public events: proto.IEvent[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IEvent {
    id?: number | null;
    name?: string | null;
    description?: string | null;
    slug?: string | null;
    event_logo?: proto.IEventLogo | null;
    start_time?: number | null;
    time_zone?: string | null;
    end_time?: number | null;
    live_stream_url?: string | null;
    games?: proto.IGame[] | null;
    videos?: proto.IGameVideo[] | null;
    event_networks?: proto.IEventNetwork[] | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class Event implements IEvent {
    constructor(properties?: proto.IEvent);
    public id: number;
    public name: string;
    public description: string;
    public slug: string;
    public event_logo?: proto.IEventLogo | null;
    public start_time?: number | null;
    public time_zone: string;
    public end_time?: number | null;
    public live_stream_url: string;
    public games: proto.IGame[];
    public videos: proto.IGameVideo[];
    public event_networks: proto.IEventNetwork[];
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IEventLogoResult {
    eventlogos?: proto.IEventLogo[] | null;
  }

  class EventLogoResult implements IEventLogoResult {
    constructor(properties?: proto.IEventLogoResult);
    public eventlogos: proto.IEventLogo[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IEventLogo {
    id?: number | null;
    event?: proto.IEvent | null;
    alpha_channel?: boolean | null;
    animated?: boolean | null;
    height?: number | null;
    image_id?: string | null;
    url?: string | null;
    width?: number | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class EventLogo implements IEventLogo {
    constructor(properties?: proto.IEventLogo);
    public id: number;
    public event?: proto.IEvent | null;
    public alpha_channel: boolean;
    public animated: boolean;
    public height: number;
    public image_id: string;
    public url: string;
    public width: number;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IEventNetworkResult {
    eventnetworks?: proto.IEventNetwork[] | null;
  }

  class EventNetworkResult implements IEventNetworkResult {
    constructor(properties?: proto.IEventNetworkResult);
    public eventnetworks: proto.IEventNetwork[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IEventNetwork {
    id?: number | null;
    event?: proto.IEvent | null;
    url?: string | null;
    network_type?: proto.INetworkType | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class EventNetwork implements IEventNetwork {
    constructor(properties?: proto.IEventNetwork);
    public id: number;
    public event?: proto.IEvent | null;
    public url: string;
    public network_type?: proto.INetworkType | null;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IExternalGameResult {
    externalgames?: proto.IExternalGame[] | null;
  }

  class ExternalGameResult implements IExternalGameResult {
    constructor(properties?: proto.IExternalGameResult);
    public externalgames: proto.IExternalGame[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IExternalGame {
    id?: number | null;
    category?: proto.ExternalGameCategoryEnum | null;
    created_at?: number | null;
    game?: proto.IGame | null;
    name?: string | null;
    uid?: string | null;
    updated_at?: number | null;
    url?: string | null;
    year?: number | null;
    media?: proto.ExternalGameMediaEnum | null;
    platform?: proto.IPlatform | null;
    countries?: number[] | null;
    checksum?: string | null;
    external_game_source?: proto.IExternalGameSource | null;
    game_release_format?: proto.IGameReleaseFormat | null;
  }

  class ExternalGame implements IExternalGame {
    constructor(properties?: proto.IExternalGame);
    public id: number;
    public category: proto.ExternalGameCategoryEnum;
    public created_at?: number | null;
    public game?: proto.IGame | null;
    public name: string;
    public uid: string;
    public updated_at?: number | null;
    public url: string;
    public year: number;
    public media: proto.ExternalGameMediaEnum;
    public platform?: proto.IPlatform | null;
    public countries: number[];
    public checksum: string;
    public external_game_source?: proto.IExternalGameSource | null;
    public game_release_format?: proto.IGameReleaseFormat | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum ExternalGameCategoryEnum {
    EXTERNALGAME_CATEGORY_NULL = 0,
    EXTERNALGAME_STEAM = 1,
    EXTERNALGAME_GOG = 5,
    EXTERNALGAME_YOUTUBE = 10,
    EXTERNALGAME_MICROSOFT = 11,
    EXTERNALGAME_APPLE = 13,
    EXTERNALGAME_TWITCH = 14,
    EXTERNALGAME_ANDROID = 15,
    EXTERNALGAME_AMAZON_ASIN = 20,
    EXTERNALGAME_AMAZON_LUNA = 22,
    EXTERNALGAME_AMAZON_ADG = 23,
    EXTERNALGAME_EPIC_GAME_STORE = 26,
    EXTERNALGAME_OCULUS = 28,
    EXTERNALGAME_UTOMIK = 29,
    EXTERNALGAME_ITCH_IO = 30,
    EXTERNALGAME_XBOX_MARKETPLACE = 31,
    EXTERNALGAME_KARTRIDGE = 32,
    EXTERNALGAME_PLAYSTATION_STORE_US = 36,
    EXTERNALGAME_FOCUS_ENTERTAINMENT = 37,
    EXTERNALGAME_XBOX_GAME_PASS_ULTIMATE_CLOUD = 54,
    EXTERNALGAME_GAMEJOLT = 55,
  }

  enum ExternalGameMediaEnum {
    EXTERNALGAME_MEDIA_NULL = 0,
    EXTERNALGAME_DIGITAL = 1,
    EXTERNALGAME_PHYSICAL = 2,
  }

  interface IExternalGameSourceResult {
    externalgamesources?: proto.IExternalGameSource[] | null;
  }

  class ExternalGameSourceResult implements IExternalGameSourceResult {
    constructor(properties?: proto.IExternalGameSourceResult);
    public externalgamesources: proto.IExternalGameSource[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IExternalGameSource {
    id?: number | null;
    name?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class ExternalGameSource implements IExternalGameSource {
    constructor(properties?: proto.IExternalGameSource);
    public id: number;
    public name: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IFranchiseResult {
    franchises?: proto.IFranchise[] | null;
  }

  class FranchiseResult implements IFranchiseResult {
    constructor(properties?: proto.IFranchiseResult);
    public franchises: proto.IFranchise[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IFranchise {
    id?: number | null;
    created_at?: number | null;
    games?: proto.IGame[] | null;
    name?: string | null;
    slug?: string | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class Franchise implements IFranchise {
    constructor(properties?: proto.IFranchise);
    public id: number;
    public created_at?: number | null;
    public games: proto.IGame[];
    public name: string;
    public slug: string;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameResult {
    games?: proto.IGame[] | null;
  }

  class GameResult implements IGameResult {
    constructor(properties?: proto.IGameResult);
    public games: proto.IGame[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGame {
    id?: number | null;
    age_ratings?: proto.IAgeRating[] | null;
    aggregated_rating?: number | null;
    aggregated_rating_count?: number | null;
    alternative_names?: proto.IAlternativeName[] | null;
    artworks?: proto.IArtwork[] | null;
    bundles?: proto.IGame[] | null;
    category?: proto.GameCategoryEnum | null;
    collection?: proto.ICollection | null;
    cover?: proto.ICover | null;
    created_at?: number | null;
    dlcs?: proto.IGame[] | null;
    expansions?: proto.IGame[] | null;
    external_games?: proto.IExternalGame[] | null;
    first_release_date?: number | null;
    follows?: number | null;
    franchise?: proto.IFranchise | null;
    franchises?: proto.IFranchise[] | null;
    game_engines?: proto.IGameEngine[] | null;
    game_modes?: proto.IGameMode[] | null;
    genres?: proto.IGenre[] | null;
    hypes?: number | null;
    involved_companies?: proto.IInvolvedCompany[] | null;
    keywords?: proto.IKeyword[] | null;
    multiplayer_modes?: proto.IMultiplayerMode[] | null;
    name?: string | null;
    parent_game?: proto.IGame | null;
    platforms?: proto.IPlatform[] | null;
    player_perspectives?: proto.IPlayerPerspective[] | null;
    rating?: number | null;
    rating_count?: number | null;
    release_dates?: proto.IReleaseDate[] | null;
    screenshots?: proto.IScreenshot[] | null;
    similar_games?: proto.IGame[] | null;
    slug?: string | null;
    standalone_expansions?: proto.IGame[] | null;
    status?: proto.GameStatusEnum | null;
    storyline?: string | null;
    summary?: string | null;
    tags?: number[] | null;
    themes?: proto.ITheme[] | null;
    total_rating?: number | null;
    total_rating_count?: number | null;
    updated_at?: number | null;
    url?: string | null;
    version_parent?: proto.IGame | null;
    version_title?: string | null;
    videos?: proto.IGameVideo[] | null;
    websites?: proto.IWebsite[] | null;
    checksum?: string | null;
    remakes?: proto.IGame[] | null;
    remasters?: proto.IGame[] | null;
    expanded_games?: proto.IGame[] | null;
    ports?: proto.IGame[] | null;
    forks?: proto.IGame[] | null;
    language_supports?: proto.ILanguageSupport[] | null;
    game_localizations?: proto.IGameLocalization[] | null;
    collections?: proto.ICollection[] | null;
    game_status?: proto.IGameStatus | null;
    game_type?: proto.IGameType | null;
  }

  class Game implements IGame {
    constructor(properties?: proto.IGame);
    public id: number;
    public age_ratings: proto.IAgeRating[];
    public aggregated_rating: number;
    public aggregated_rating_count: number;
    public alternative_names: proto.IAlternativeName[];
    public artworks: proto.IArtwork[];
    public bundles: proto.IGame[];
    public category: proto.GameCategoryEnum;
    public collection?: proto.ICollection | null;
    public cover?: proto.ICover | null;
    public created_at?: number | null;
    public dlcs: proto.IGame[];
    public expansions: proto.IGame[];
    public external_games: proto.IExternalGame[];
    public first_release_date?: number | null;
    public follows: number;
    public franchise?: proto.IFranchise | null;
    public franchises: proto.IFranchise[];
    public game_engines: proto.IGameEngine[];
    public game_modes: proto.IGameMode[];
    public genres: proto.IGenre[];
    public hypes: number;
    public involved_companies: proto.IInvolvedCompany[];
    public keywords: proto.IKeyword[];
    public multiplayer_modes: proto.IMultiplayerMode[];
    public name: string;
    public parent_game?: proto.IGame | null;
    public platforms: proto.IPlatform[];
    public player_perspectives: proto.IPlayerPerspective[];
    public rating: number;
    public rating_count: number;
    public release_dates: proto.IReleaseDate[];
    public screenshots: proto.IScreenshot[];
    public similar_games: proto.IGame[];
    public slug: string;
    public standalone_expansions: proto.IGame[];
    public status: proto.GameStatusEnum;
    public storyline: string;
    public summary: string;
    public tags: number[];
    public themes: proto.ITheme[];
    public total_rating: number;
    public total_rating_count: number;
    public updated_at?: number | null;
    public url: string;
    public version_parent?: proto.IGame | null;
    public version_title: string;
    public videos: proto.IGameVideo[];
    public websites: proto.IWebsite[];
    public checksum: string;
    public remakes: proto.IGame[];
    public remasters: proto.IGame[];
    public expanded_games: proto.IGame[];
    public ports: proto.IGame[];
    public forks: proto.IGame[];
    public language_supports: proto.ILanguageSupport[];
    public game_localizations: proto.IGameLocalization[];
    public collections: proto.ICollection[];
    public game_status?: proto.IGameStatus | null;
    public game_type?: proto.IGameType | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum GameCategoryEnum {
    MAIN_GAME = 0,
    DLC_ADDON = 1,
    EXPANSION = 2,
    BUNDLE = 3,
    STANDALONE_EXPANSION = 4,
    MOD = 5,
    EPISODE = 6,
    SEASON = 7,
    REMAKE = 8,
    REMASTER = 9,
    EXPANDED_GAME = 10,
    PORT = 11,
    FORK = 12,
    PACK = 13,
    UPDATE = 14,
  }

  enum GameStatusEnum {
    RELEASED = 0,
    ALPHA = 2,
    BETA = 3,
    EARLY_ACCESS = 4,
    OFFLINE = 5,
    CANCELLED = 6,
    RUMORED = 7,
    DELISTED = 8,
  }

  interface IGameEngineResult {
    gameengines?: proto.IGameEngine[] | null;
  }

  class GameEngineResult implements IGameEngineResult {
    constructor(properties?: proto.IGameEngineResult);
    public gameengines: proto.IGameEngine[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameEngine {
    id?: number | null;
    companies?: proto.ICompany[] | null;
    created_at?: number | null;
    description?: string | null;
    logo?: proto.IGameEngineLogo | null;
    name?: string | null;
    platforms?: proto.IPlatform[] | null;
    slug?: string | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class GameEngine implements IGameEngine {
    constructor(properties?: proto.IGameEngine);
    public id: number;
    public companies: proto.ICompany[];
    public created_at?: number | null;
    public description: string;
    public logo?: proto.IGameEngineLogo | null;
    public name: string;
    public platforms: proto.IPlatform[];
    public slug: string;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameEngineLogoResult {
    gameenginelogos?: proto.IGameEngineLogo[] | null;
  }

  class GameEngineLogoResult implements IGameEngineLogoResult {
    constructor(properties?: proto.IGameEngineLogoResult);
    public gameenginelogos: proto.IGameEngineLogo[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameEngineLogo {
    id?: number | null;
    alpha_channel?: boolean | null;
    animated?: boolean | null;
    height?: number | null;
    image_id?: string | null;
    url?: string | null;
    width?: number | null;
    checksum?: string | null;
  }

  class GameEngineLogo implements IGameEngineLogo {
    constructor(properties?: proto.IGameEngineLogo);
    public id: number;
    public alpha_channel: boolean;
    public animated: boolean;
    public height: number;
    public image_id: string;
    public url: string;
    public width: number;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameLocalizationResult {
    gamelocalizations?: proto.IGameLocalization[] | null;
  }

  class GameLocalizationResult implements IGameLocalizationResult {
    constructor(properties?: proto.IGameLocalizationResult);
    public gamelocalizations: proto.IGameLocalization[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameLocalization {
    id?: number | null;
    name?: string | null;
    cover?: proto.ICover | null;
    game?: proto.IGame | null;
    region?: proto.IRegion | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class GameLocalization implements IGameLocalization {
    constructor(properties?: proto.IGameLocalization);
    public id: number;
    public name: string;
    public cover?: proto.ICover | null;
    public game?: proto.IGame | null;
    public region?: proto.IRegion | null;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameModeResult {
    gamemodes?: proto.IGameMode[] | null;
  }

  class GameModeResult implements IGameModeResult {
    constructor(properties?: proto.IGameModeResult);
    public gamemodes: proto.IGameMode[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameMode {
    id?: number | null;
    created_at?: number | null;
    name?: string | null;
    slug?: string | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class GameMode implements IGameMode {
    constructor(properties?: proto.IGameMode);
    public id: number;
    public created_at?: number | null;
    public name: string;
    public slug: string;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameReleaseFormatResult {
    gamereleaseformats?: proto.IGameReleaseFormat[] | null;
  }

  class GameReleaseFormatResult implements IGameReleaseFormatResult {
    constructor(properties?: proto.IGameReleaseFormatResult);
    public gamereleaseformats: proto.IGameReleaseFormat[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameReleaseFormat {
    id?: number | null;
    format?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class GameReleaseFormat implements IGameReleaseFormat {
    constructor(properties?: proto.IGameReleaseFormat);
    public id: number;
    public format: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameStatusResult {
    gamestatuses?: proto.IGameStatus[] | null;
  }

  class GameStatusResult implements IGameStatusResult {
    constructor(properties?: proto.IGameStatusResult);
    public gamestatuses: proto.IGameStatus[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameStatus {
    id?: number | null;
    status?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class GameStatus implements IGameStatus {
    constructor(properties?: proto.IGameStatus);
    public id: number;
    public status: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameTimeToBeatResult {
    gametimetobeats?: proto.IGameTimeToBeat[] | null;
  }

  class GameTimeToBeatResult implements IGameTimeToBeatResult {
    constructor(properties?: proto.IGameTimeToBeatResult);
    public gametimetobeats: proto.IGameTimeToBeat[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameTimeToBeat {
    id?: number | null;
    game_id?: number | null;
    hastily?: number | null;
    normally?: number | null;
    completely?: number | null;
    count?: number | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class GameTimeToBeat implements IGameTimeToBeat {
    constructor(properties?: proto.IGameTimeToBeat);
    public id: number;
    public game_id: number;
    public hastily: number;
    public normally: number;
    public completely: number;
    public count: number;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameTypeResult {
    gametypes?: proto.IGameType[] | null;
  }

  class GameTypeResult implements IGameTypeResult {
    constructor(properties?: proto.IGameTypeResult);
    public gametypes: proto.IGameType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameType {
    id?: number | null;
    type?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class GameType implements IGameType {
    constructor(properties?: proto.IGameType);
    public id: number;
    public type: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameVersionResult {
    gameversions?: proto.IGameVersion[] | null;
  }

  class GameVersionResult implements IGameVersionResult {
    constructor(properties?: proto.IGameVersionResult);
    public gameversions: proto.IGameVersion[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameVersion {
    id?: number | null;
    created_at?: number | null;
    features?: proto.IGameVersionFeature[] | null;
    game?: proto.IGame | null;
    games?: proto.IGame[] | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class GameVersion implements IGameVersion {
    constructor(properties?: proto.IGameVersion);
    public id: number;
    public created_at?: number | null;
    public features: proto.IGameVersionFeature[];
    public game?: proto.IGame | null;
    public games: proto.IGame[];
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameVersionFeatureResult {
    gameversionfeatures?: proto.IGameVersionFeature[] | null;
  }

  class GameVersionFeatureResult implements IGameVersionFeatureResult {
    constructor(properties?: proto.IGameVersionFeatureResult);
    public gameversionfeatures: proto.IGameVersionFeature[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameVersionFeature {
    id?: number | null;
    category?: proto.GameVersionFeatureCategoryEnum | null;
    description?: string | null;
    position?: number | null;
    title?: string | null;
    values?: proto.IGameVersionFeatureValue[] | null;
    checksum?: string | null;
  }

  class GameVersionFeature implements IGameVersionFeature {
    constructor(properties?: proto.IGameVersionFeature);
    public id: number;
    public category: proto.GameVersionFeatureCategoryEnum;
    public description: string;
    public position: number;
    public title: string;
    public values: proto.IGameVersionFeatureValue[];
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum GameVersionFeatureCategoryEnum {
    BOOLEAN = 0,
    DESCRIPTION = 1,
  }

  interface IGameVersionFeatureValueResult {
    gameversionfeaturevalues?: proto.IGameVersionFeatureValue[] | null;
  }

  class GameVersionFeatureValueResult
    implements IGameVersionFeatureValueResult
  {
    constructor(properties?: proto.IGameVersionFeatureValueResult);
    public gameversionfeaturevalues: proto.IGameVersionFeatureValue[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameVersionFeatureValue {
    id?: number | null;
    game?: proto.IGame | null;
    game_feature?: proto.IGameVersionFeature | null;
    included_feature?: proto.GameVersionFeatureValueIncludedFeatureEnum | null;
    note?: string | null;
    checksum?: string | null;
  }

  class GameVersionFeatureValue implements IGameVersionFeatureValue {
    constructor(properties?: proto.IGameVersionFeatureValue);
    public id: number;
    public game?: proto.IGame | null;
    public game_feature?: proto.IGameVersionFeature | null;
    public included_feature: proto.GameVersionFeatureValueIncludedFeatureEnum;
    public note: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum GameVersionFeatureValueIncludedFeatureEnum {
    NOT_INCLUDED = 0,
    INCLUDED = 1,
    PRE_ORDER_ONLY = 2,
  }

  interface IGameVideoResult {
    gamevideos?: proto.IGameVideo[] | null;
  }

  class GameVideoResult implements IGameVideoResult {
    constructor(properties?: proto.IGameVideoResult);
    public gamevideos: proto.IGameVideo[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGameVideo {
    id?: number | null;
    game?: proto.IGame | null;
    name?: string | null;
    video_id?: string | null;
    checksum?: string | null;
  }

  class GameVideo implements IGameVideo {
    constructor(properties?: proto.IGameVideo);
    public id: number;
    public game?: proto.IGame | null;
    public name: string;
    public video_id: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGenreResult {
    genres?: proto.IGenre[] | null;
  }

  class GenreResult implements IGenreResult {
    constructor(properties?: proto.IGenreResult);
    public genres: proto.IGenre[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IGenre {
    id?: number | null;
    created_at?: number | null;
    name?: string | null;
    slug?: string | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class Genre implements IGenre {
    constructor(properties?: proto.IGenre);
    public id: number;
    public created_at?: number | null;
    public name: string;
    public slug: string;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IInvolvedCompanyResult {
    involvedcompanies?: proto.IInvolvedCompany[] | null;
  }

  class InvolvedCompanyResult implements IInvolvedCompanyResult {
    constructor(properties?: proto.IInvolvedCompanyResult);
    public involvedcompanies: proto.IInvolvedCompany[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IInvolvedCompany {
    id?: number | null;
    company?: proto.ICompany | null;
    created_at?: number | null;
    developer?: boolean | null;
    game?: proto.IGame | null;
    porting?: boolean | null;
    publisher?: boolean | null;
    supporting?: boolean | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class InvolvedCompany implements IInvolvedCompany {
    constructor(properties?: proto.IInvolvedCompany);
    public id: number;
    public company?: proto.ICompany | null;
    public created_at?: number | null;
    public developer: boolean;
    public game?: proto.IGame | null;
    public porting: boolean;
    public publisher: boolean;
    public supporting: boolean;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IKeywordResult {
    keywords?: proto.IKeyword[] | null;
  }

  class KeywordResult implements IKeywordResult {
    constructor(properties?: proto.IKeywordResult);
    public keywords: proto.IKeyword[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IKeyword {
    id?: number | null;
    created_at?: number | null;
    name?: string | null;
    slug?: string | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class Keyword implements IKeyword {
    constructor(properties?: proto.IKeyword);
    public id: number;
    public created_at?: number | null;
    public name: string;
    public slug: string;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ILanguageResult {
    languages?: proto.ILanguage[] | null;
  }

  class LanguageResult implements ILanguageResult {
    constructor(properties?: proto.ILanguageResult);
    public languages: proto.ILanguage[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ILanguage {
    id?: number | null;
    name?: string | null;
    native_name?: string | null;
    locale?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class Language implements ILanguage {
    constructor(properties?: proto.ILanguage);
    public id: number;
    public name: string;
    public native_name: string;
    public locale: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ILanguageSupportResult {
    languagesupports?: proto.ILanguageSupport[] | null;
  }

  class LanguageSupportResult implements ILanguageSupportResult {
    constructor(properties?: proto.ILanguageSupportResult);
    public languagesupports: proto.ILanguageSupport[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ILanguageSupport {
    id?: number | null;
    game?: proto.IGame | null;
    language?: proto.ILanguage | null;
    language_support_type?: proto.ILanguageSupportType | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class LanguageSupport implements ILanguageSupport {
    constructor(properties?: proto.ILanguageSupport);
    public id: number;
    public game?: proto.IGame | null;
    public language?: proto.ILanguage | null;
    public language_support_type?: proto.ILanguageSupportType | null;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ILanguageSupportTypeResult {
    languagesupporttypes?: proto.ILanguageSupportType[] | null;
  }

  class LanguageSupportTypeResult implements ILanguageSupportTypeResult {
    constructor(properties?: proto.ILanguageSupportTypeResult);
    public languagesupporttypes: proto.ILanguageSupportType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ILanguageSupportType {
    id?: number | null;
    name?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class LanguageSupportType implements ILanguageSupportType {
    constructor(properties?: proto.ILanguageSupportType);
    public id: number;
    public name: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IMultiplayerModeResult {
    multiplayermodes?: proto.IMultiplayerMode[] | null;
  }

  class MultiplayerModeResult implements IMultiplayerModeResult {
    constructor(properties?: proto.IMultiplayerModeResult);
    public multiplayermodes: proto.IMultiplayerMode[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IMultiplayerMode {
    id?: number | null;
    campaigncoop?: boolean | null;
    dropin?: boolean | null;
    game?: proto.IGame | null;
    lancoop?: boolean | null;
    offlinecoop?: boolean | null;
    offlinecoopmax?: number | null;
    offlinemax?: number | null;
    onlinecoop?: boolean | null;
    onlinecoopmax?: number | null;
    onlinemax?: number | null;
    platform?: proto.IPlatform | null;
    splitscreen?: boolean | null;
    splitscreenonline?: boolean | null;
    checksum?: string | null;
  }

  class MultiplayerMode implements IMultiplayerMode {
    constructor(properties?: proto.IMultiplayerMode);
    public id: number;
    public campaigncoop: boolean;
    public dropin: boolean;
    public game?: proto.IGame | null;
    public lancoop: boolean;
    public offlinecoop: boolean;
    public offlinecoopmax: number;
    public offlinemax: number;
    public onlinecoop: boolean;
    public onlinecoopmax: number;
    public onlinemax: number;
    public platform?: proto.IPlatform | null;
    public splitscreen: boolean;
    public splitscreenonline: boolean;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface INetworkTypeResult {
    networktypes?: proto.INetworkType[] | null;
  }

  class NetworkTypeResult implements INetworkTypeResult {
    constructor(properties?: proto.INetworkTypeResult);
    public networktypes: proto.INetworkType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface INetworkType {
    id?: number | null;
    name?: string | null;
    event_networks?: proto.IEventNetwork[] | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class NetworkType implements INetworkType {
    constructor(properties?: proto.INetworkType);
    public id: number;
    public name: string;
    public event_networks: proto.IEventNetwork[];
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformResult {
    platforms?: proto.IPlatform[] | null;
  }

  class PlatformResult implements IPlatformResult {
    constructor(properties?: proto.IPlatformResult);
    public platforms: proto.IPlatform[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatform {
    id?: number | null;
    abbreviation?: string | null;
    alternative_name?: string | null;
    category?: proto.PlatformCategoryEnum | null;
    created_at?: number | null;
    generation?: number | null;
    name?: string | null;
    platform_logo?: proto.IPlatformLogo | null;
    platform_family?: proto.IPlatformFamily | null;
    slug?: string | null;
    summary?: string | null;
    updated_at?: number | null;
    url?: string | null;
    versions?: proto.IPlatformVersion[] | null;
    websites?: proto.IPlatformWebsite[] | null;
    checksum?: string | null;
    platform_type?: proto.IPlatformType | null;
  }

  class Platform implements IPlatform {
    constructor(properties?: proto.IPlatform);
    public id: number;
    public abbreviation: string;
    public alternative_name: string;
    public category: proto.PlatformCategoryEnum;
    public created_at?: number | null;
    public generation: number;
    public name: string;
    public platform_logo?: proto.IPlatformLogo | null;
    public platform_family?: proto.IPlatformFamily | null;
    public slug: string;
    public summary: string;
    public updated_at?: number | null;
    public url: string;
    public versions: proto.IPlatformVersion[];
    public websites: proto.IPlatformWebsite[];
    public checksum: string;
    public platform_type?: proto.IPlatformType | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum PlatformCategoryEnum {
    PLATFORM_CATEGORY_NULL = 0,
    CONSOLE = 1,
    ARCADE = 2,
    PLATFORM = 3,
    OPERATING_SYSTEM = 4,
    PORTABLE_CONSOLE = 5,
    COMPUTER = 6,
  }

  interface IPlatformFamilyResult {
    platformfamilies?: proto.IPlatformFamily[] | null;
  }

  class PlatformFamilyResult implements IPlatformFamilyResult {
    constructor(properties?: proto.IPlatformFamilyResult);
    public platformfamilies: proto.IPlatformFamily[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformFamily {
    id?: number | null;
    name?: string | null;
    slug?: string | null;
    checksum?: string | null;
  }

  class PlatformFamily implements IPlatformFamily {
    constructor(properties?: proto.IPlatformFamily);
    public id: number;
    public name: string;
    public slug: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformLogoResult {
    platformlogos?: proto.IPlatformLogo[] | null;
  }

  class PlatformLogoResult implements IPlatformLogoResult {
    constructor(properties?: proto.IPlatformLogoResult);
    public platformlogos: proto.IPlatformLogo[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformLogo {
    id?: number | null;
    alpha_channel?: boolean | null;
    animated?: boolean | null;
    height?: number | null;
    image_id?: string | null;
    url?: string | null;
    width?: number | null;
    checksum?: string | null;
  }

  class PlatformLogo implements IPlatformLogo {
    constructor(properties?: proto.IPlatformLogo);
    public id: number;
    public alpha_channel: boolean;
    public animated: boolean;
    public height: number;
    public image_id: string;
    public url: string;
    public width: number;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformTypeResult {
    platformtypes?: proto.IPlatformType[] | null;
  }

  class PlatformTypeResult implements IPlatformTypeResult {
    constructor(properties?: proto.IPlatformTypeResult);
    public platformtypes: proto.IPlatformType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformType {
    id?: number | null;
    name?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class PlatformType implements IPlatformType {
    constructor(properties?: proto.IPlatformType);
    public id: number;
    public name: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformVersionResult {
    platformversions?: proto.IPlatformVersion[] | null;
  }

  class PlatformVersionResult implements IPlatformVersionResult {
    constructor(properties?: proto.IPlatformVersionResult);
    public platformversions: proto.IPlatformVersion[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformVersion {
    id?: number | null;
    companies?: proto.IPlatformVersionCompany[] | null;
    connectivity?: string | null;
    cpu?: string | null;
    graphics?: string | null;
    main_manufacturer?: proto.IPlatformVersionCompany | null;
    media?: string | null;
    memory?: string | null;
    name?: string | null;
    os?: string | null;
    output?: string | null;
    platform_logo?: proto.IPlatformLogo | null;
    platform_version_release_dates?: proto.IPlatformVersionReleaseDate[] | null;
    resolutions?: string | null;
    slug?: string | null;
    sound?: string | null;
    storage?: string | null;
    summary?: string | null;
    url?: string | null;
    checksum?: string | null;
  }

  class PlatformVersion implements IPlatformVersion {
    constructor(properties?: proto.IPlatformVersion);
    public id: number;
    public companies: proto.IPlatformVersionCompany[];
    public connectivity: string;
    public cpu: string;
    public graphics: string;
    public main_manufacturer?: proto.IPlatformVersionCompany | null;
    public media: string;
    public memory: string;
    public name: string;
    public os: string;
    public output: string;
    public platform_logo?: proto.IPlatformLogo | null;
    public platform_version_release_dates: proto.IPlatformVersionReleaseDate[];
    public resolutions: string;
    public slug: string;
    public sound: string;
    public storage: string;
    public summary: string;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformVersionCompanyResult {
    platformversioncompanies?: proto.IPlatformVersionCompany[] | null;
  }

  class PlatformVersionCompanyResult implements IPlatformVersionCompanyResult {
    constructor(properties?: proto.IPlatformVersionCompanyResult);
    public platformversioncompanies: proto.IPlatformVersionCompany[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformVersionCompany {
    id?: number | null;
    comment?: string | null;
    company?: proto.ICompany | null;
    developer?: boolean | null;
    manufacturer?: boolean | null;
    checksum?: string | null;
  }

  class PlatformVersionCompany implements IPlatformVersionCompany {
    constructor(properties?: proto.IPlatformVersionCompany);
    public id: number;
    public comment: string;
    public company?: proto.ICompany | null;
    public developer: boolean;
    public manufacturer: boolean;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformVersionReleaseDateResult {
    platformversionreleasedates?: proto.IPlatformVersionReleaseDate[] | null;
  }

  class PlatformVersionReleaseDateResult
    implements IPlatformVersionReleaseDateResult
  {
    constructor(properties?: proto.IPlatformVersionReleaseDateResult);
    public platformversionreleasedates: proto.IPlatformVersionReleaseDate[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformVersionReleaseDate {
    id?: number | null;
    category?: proto.DateFormatChangeDateCategoryEnum | null;
    created_at?: number | null;
    date?: number | null;
    human?: string | null;
    m?: number | null;
    platform_version?: proto.IPlatformVersion | null;
    region?: proto.RegionRegionEnum | null;
    updated_at?: number | null;
    y?: number | null;
    checksum?: string | null;
    date_format?: proto.IDateFormat | null;
    release_region?: proto.IReleaseDateRegion | null;
  }

  class PlatformVersionReleaseDate implements IPlatformVersionReleaseDate {
    constructor(properties?: proto.IPlatformVersionReleaseDate);
    public id: number;
    public category: proto.DateFormatChangeDateCategoryEnum;
    public created_at?: number | null;
    public date?: number | null;
    public human: string;
    public m: number;
    public platform_version?: proto.IPlatformVersion | null;
    public region: proto.RegionRegionEnum;
    public updated_at?: number | null;
    public y: number;
    public checksum: string;
    public date_format?: proto.IDateFormat | null;
    public release_region?: proto.IReleaseDateRegion | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum RegionRegionEnum {
    REGION_REGION_NULL = 0,
    EUROPE = 1,
    NORTH_AMERICA = 2,
    AUSTRALIA = 3,
    NEW_ZEALAND = 4,
    JAPAN = 5,
    CHINA = 6,
    ASIA = 7,
    WORLDWIDE = 8,
    KOREA = 9,
    BRAZIL = 10,
  }

  interface IPlatformWebsiteResult {
    platformwebsites?: proto.IPlatformWebsite[] | null;
  }

  class PlatformWebsiteResult implements IPlatformWebsiteResult {
    constructor(properties?: proto.IPlatformWebsiteResult);
    public platformwebsites: proto.IPlatformWebsite[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlatformWebsite {
    id?: number | null;
    category?: proto.WebsiteCategoryEnum | null;
    trusted?: boolean | null;
    url?: string | null;
    checksum?: string | null;
  }

  class PlatformWebsite implements IPlatformWebsite {
    constructor(properties?: proto.IPlatformWebsite);
    public id: number;
    public category: proto.WebsiteCategoryEnum;
    public trusted: boolean;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlayerPerspectiveResult {
    playerperspectives?: proto.IPlayerPerspective[] | null;
  }

  class PlayerPerspectiveResult implements IPlayerPerspectiveResult {
    constructor(properties?: proto.IPlayerPerspectiveResult);
    public playerperspectives: proto.IPlayerPerspective[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPlayerPerspective {
    id?: number | null;
    created_at?: number | null;
    name?: string | null;
    slug?: string | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class PlayerPerspective implements IPlayerPerspective {
    constructor(properties?: proto.IPlayerPerspective);
    public id: number;
    public created_at?: number | null;
    public name: string;
    public slug: string;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPopularityPrimitiveResult {
    popularityprimitives?: proto.IPopularityPrimitive[] | null;
  }

  class PopularityPrimitiveResult implements IPopularityPrimitiveResult {
    constructor(properties?: proto.IPopularityPrimitiveResult);
    public popularityprimitives: proto.IPopularityPrimitive[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPopularityPrimitive {
    id?: number | null;
    game_id?: number | null;
    popularity_type?: proto.IPopularityType | null;
    popularity_source?: proto.PopularitySourcePopularitySourceEnum | null;
    value?: number | null;
    calculated_at?: number | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
    external_popularity_source?: proto.IExternalGameSource | null;
  }

  class PopularityPrimitive implements IPopularityPrimitive {
    constructor(properties?: proto.IPopularityPrimitive);
    public id: number;
    public game_id: number;
    public popularity_type?: proto.IPopularityType | null;
    public popularity_source: proto.PopularitySourcePopularitySourceEnum;
    public value: number;
    public calculated_at?: number | null;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public external_popularity_source?: proto.IExternalGameSource | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum PopularitySourcePopularitySourceEnum {
    POPULARITYSOURCE_POPULARITY_SOURCE_NULL = 0,
    IGDB = 121,
  }

  interface IPopularityTypeResult {
    popularitytypes?: proto.IPopularityType[] | null;
  }

  class PopularityTypeResult implements IPopularityTypeResult {
    constructor(properties?: proto.IPopularityTypeResult);
    public popularitytypes: proto.IPopularityType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IPopularityType {
    id?: number | null;
    popularity_source?: proto.PopularitySourcePopularitySourceEnum | null;
    name?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
    external_popularity_source?: proto.IExternalGameSource | null;
  }

  class PopularityType implements IPopularityType {
    constructor(properties?: proto.IPopularityType);
    public id: number;
    public popularity_source: proto.PopularitySourcePopularitySourceEnum;
    public name: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public external_popularity_source?: proto.IExternalGameSource | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IRegionResult {
    regions?: proto.IRegion[] | null;
  }

  class RegionResult implements IRegionResult {
    constructor(properties?: proto.IRegionResult);
    public regions: proto.IRegion[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IRegion {
    id?: number | null;
    name?: string | null;
    category?: string | null;
    identifier?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class Region implements IRegion {
    constructor(properties?: proto.IRegion);
    public id: number;
    public name: string;
    public category: string;
    public identifier: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IReleaseDateResult {
    releasedates?: proto.IReleaseDate[] | null;
  }

  class ReleaseDateResult implements IReleaseDateResult {
    constructor(properties?: proto.IReleaseDateResult);
    public releasedates: proto.IReleaseDate[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IReleaseDate {
    id?: number | null;
    category?: proto.DateFormatChangeDateCategoryEnum | null;
    created_at?: number | null;
    date?: number | null;
    game?: proto.IGame | null;
    human?: string | null;
    m?: number | null;
    platform?: proto.IPlatform | null;
    region?: proto.RegionRegionEnum | null;
    updated_at?: number | null;
    y?: number | null;
    checksum?: string | null;
    status?: proto.IReleaseDateStatus | null;
    date_format?: proto.IDateFormat | null;
    release_region?: proto.IReleaseDateRegion | null;
  }

  class ReleaseDate implements IReleaseDate {
    constructor(properties?: proto.IReleaseDate);
    public id: number;
    public category: proto.DateFormatChangeDateCategoryEnum;
    public created_at?: number | null;
    public date?: number | null;
    public game?: proto.IGame | null;
    public human: string;
    public m: number;
    public platform?: proto.IPlatform | null;
    public region: proto.RegionRegionEnum;
    public updated_at?: number | null;
    public y: number;
    public checksum: string;
    public status?: proto.IReleaseDateStatus | null;
    public date_format?: proto.IDateFormat | null;
    public release_region?: proto.IReleaseDateRegion | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IReleaseDateRegionResult {
    releasedateregions?: proto.IReleaseDateRegion[] | null;
  }

  class ReleaseDateRegionResult implements IReleaseDateRegionResult {
    constructor(properties?: proto.IReleaseDateRegionResult);
    public releasedateregions: proto.IReleaseDateRegion[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IReleaseDateRegion {
    id?: number | null;
    region?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class ReleaseDateRegion implements IReleaseDateRegion {
    constructor(properties?: proto.IReleaseDateRegion);
    public id: number;
    public region: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IReleaseDateStatusResult {
    releasedatestatuses?: proto.IReleaseDateStatus[] | null;
  }

  class ReleaseDateStatusResult implements IReleaseDateStatusResult {
    constructor(properties?: proto.IReleaseDateStatusResult);
    public releasedatestatuses: proto.IReleaseDateStatus[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IReleaseDateStatus {
    id?: number | null;
    name?: string | null;
    description?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class ReleaseDateStatus implements IReleaseDateStatus {
    constructor(properties?: proto.IReleaseDateStatus);
    public id: number;
    public name: string;
    public description: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IScreenshotResult {
    screenshots?: proto.IScreenshot[] | null;
  }

  class ScreenshotResult implements IScreenshotResult {
    constructor(properties?: proto.IScreenshotResult);
    public screenshots: proto.IScreenshot[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IScreenshot {
    id?: number | null;
    alpha_channel?: boolean | null;
    animated?: boolean | null;
    game?: proto.IGame | null;
    height?: number | null;
    image_id?: string | null;
    url?: string | null;
    width?: number | null;
    checksum?: string | null;
  }

  class Screenshot implements IScreenshot {
    constructor(properties?: proto.IScreenshot);
    public id: number;
    public alpha_channel: boolean;
    public animated: boolean;
    public game?: proto.IGame | null;
    public height: number;
    public image_id: string;
    public url: string;
    public width: number;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ISearchResult {
    searches?: proto.ISearch[] | null;
  }

  class SearchResult implements ISearchResult {
    constructor(properties?: proto.ISearchResult);
    public searches: proto.ISearch[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ISearch {
    id?: number | null;
    alternative_name?: string | null;
    character?: proto.ICharacter | null;
    collection?: proto.ICollection | null;
    company?: proto.ICompany | null;
    description?: string | null;
    game?: proto.IGame | null;
    name?: string | null;
    platform?: proto.IPlatform | null;
    published_at?: number | null;
    test_dummy?: proto.ITestDummy | null;
    theme?: proto.ITheme | null;
    checksum?: string | null;
  }

  class Search implements ISearch {
    constructor(properties?: proto.ISearch);
    public id: number;
    public alternative_name: string;
    public character?: proto.ICharacter | null;
    public collection?: proto.ICollection | null;
    public company?: proto.ICompany | null;
    public description: string;
    public game?: proto.IGame | null;
    public name: string;
    public platform?: proto.IPlatform | null;
    public published_at?: number | null;
    public test_dummy?: proto.ITestDummy | null;
    public theme?: proto.ITheme | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ITestDummyResult {
    testdummies?: proto.ITestDummy[] | null;
  }

  class TestDummyResult implements ITestDummyResult {
    constructor(properties?: proto.ITestDummyResult);
    public testdummies: proto.ITestDummy[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ITestDummy {
    id?: number | null;
    bool_value?: boolean | null;
    created_at?: number | null;
    enum_test?: proto.TestDummyEnumTestEnum | null;
    float_value?: number | null;
    game?: proto.IGame | null;
    integer_array?: number[] | null;
    integer_value?: number | null;
    name?: string | null;
    new_integer_value?: number | null;
    private?: boolean | null;
    slug?: string | null;
    string_array?: string[] | null;
    test_dummies?: proto.ITestDummy[] | null;
    test_dummy?: proto.ITestDummy | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class TestDummy implements ITestDummy {
    constructor(properties?: proto.ITestDummy);
    public id: number;
    public bool_value: boolean;
    public created_at?: number | null;
    public enum_test: proto.TestDummyEnumTestEnum;
    public float_value: number;
    public game?: proto.IGame | null;
    public integer_array: number[];
    public integer_value: number;
    public name: string;
    public new_integer_value: number;
    public private: boolean;
    public slug: string;
    public string_array: string[];
    public test_dummies: proto.ITestDummy[];
    public test_dummy?: proto.ITestDummy | null;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  enum TestDummyEnumTestEnum {
    TESTDUMMY_ENUM_TEST_NULL = 0,
    ENUM1 = 1,
    ENUM2 = 2,
  }

  interface IThemeResult {
    themes?: proto.ITheme[] | null;
  }

  class ThemeResult implements IThemeResult {
    constructor(properties?: proto.IThemeResult);
    public themes: proto.ITheme[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface ITheme {
    id?: number | null;
    created_at?: number | null;
    name?: string | null;
    slug?: string | null;
    updated_at?: number | null;
    url?: string | null;
    checksum?: string | null;
  }

  class Theme implements ITheme {
    constructor(properties?: proto.ITheme);
    public id: number;
    public created_at?: number | null;
    public name: string;
    public slug: string;
    public updated_at?: number | null;
    public url: string;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IWebsiteResult {
    websites?: proto.IWebsite[] | null;
  }

  class WebsiteResult implements IWebsiteResult {
    constructor(properties?: proto.IWebsiteResult);
    public websites: proto.IWebsite[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IWebsite {
    id?: number | null;
    category?: proto.WebsiteCategoryEnum | null;
    game?: proto.IGame | null;
    trusted?: boolean | null;
    url?: string | null;
    checksum?: string | null;
    type?: proto.IWebsiteType | null;
  }

  class Website implements IWebsite {
    constructor(properties?: proto.IWebsite);
    public id: number;
    public category: proto.WebsiteCategoryEnum;
    public game?: proto.IGame | null;
    public trusted: boolean;
    public url: string;
    public checksum: string;
    public type?: proto.IWebsiteType | null;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IWebsiteTypeResult {
    websitetypes?: proto.IWebsiteType[] | null;
  }

  class WebsiteTypeResult implements IWebsiteTypeResult {
    constructor(properties?: proto.IWebsiteTypeResult);
    public websitetypes: proto.IWebsiteType[];
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  interface IWebsiteType {
    id?: number | null;
    type?: string | null;
    created_at?: number | null;
    updated_at?: number | null;
    checksum?: string | null;
  }

  class WebsiteType implements IWebsiteType {
    constructor(properties?: proto.IWebsiteType);
    public id: number;
    public type: string;
    public created_at?: number | null;
    public updated_at?: number | null;
    public checksum: string;
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}

export namespace google {
  namespace protobuf {
    interface ITimestamp {
      seconds?: number | null;
      nanos?: number | null;
    }

    class Timestamp implements ITimestamp {
      constructor(properties?: number);
      public seconds: number;
      public nanos: number;
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }
}
