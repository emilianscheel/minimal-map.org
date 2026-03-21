import type { LocationFormState } from "../../types";
import { createDefaultOpeningHours } from "../../lib/locations/openingHours";
import type { ViewTable } from "@wordpress/dataviews";

export const LOCATIONS_TABLE_PER_PAGE = 8;

export const DEFAULT_FORM_STATE: LocationFormState = {
  title: "",
  telephone: "",
  email: "",
  website: "",
  street: "",
  house_number: "",
  postal_code: "",
  city: "",
  state: "",
  country: "",
  latitude: "",
  longitude: "",
  logo_id: 0,
  marker_id: 0,
  is_hidden: false,
  opening_hours: createDefaultOpeningHours(),
  opening_hours_notes: "",
  social_media: [
    { platform: "instagram", url: "" },
    { platform: "x", url: "" },
  ],
  tag_ids: [],
};

export const DEFAULT_VIEW: ViewTable = {
  type: "table",
  page: 1,
  perPage: LOCATIONS_TABLE_PER_PAGE,
  titleField: "title",
  mediaField: "map_preview",
  fields: [
    "logo",
    "contact",
    "social_media",
    "opening_hours",
    "address",
    "collections",
    "tags",
  ],
  layout: {
    enableMoving: false,
  },
};
