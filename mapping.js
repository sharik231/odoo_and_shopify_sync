// mapping.js
export const metafieldMapping = {
  image_set: {
    namespace: "custom",
    key: "image_set",
    type: "json",
    odooField: "image_set",  // ✅ match Odoo response
  },
  product_details: {
    namespace: "custom",
    key: "product_details",
    type: "json",
    odooField: "product_details",  // ✅
  },
  material: {
    namespace: "custom",
    key: "material",
    type: "multi_line_text_field",
    odooField: "material",  // ✅
  },
  glb_model: {
    namespace: "features",
    key: "features",
    type: "single_line_text_field",
    odooField: "x_item_glb_url",  // ✅ from your dump
  },
  assemblyinstructionsurl: {
    namespace: "features",
    key: "assemblyinstructionsurl",
    type: "single_line_text_field",
    odooField: "assembly_instructions_url",  // ✅ from your dump
  },
  dimension: {
    namespace: "Dimension",
    key: "Dimension",
    type: "single_line_text_field",
    odooField: "friendly_dimensions",  // ✅
  },
  additionalDimensions: {
    namespace: "additionalDimensions",
    key: "additionalDimensions",
    type: "multi_line_text_field",
    odooField: "additional_dimensions",  // ✅ from your dump
  },
  itemwholesaleyoutubevideokey: {
    namespace: "custom",
    key: "itemwholesaleyoutubevideokey",
    type: "single_line_text_field",
    odooField: "item_wholesale_you_tube_video_key",  // ✅
  },
  weight: {
    namespace: "custom",
    key: "weight",
    type: "single_line_text_field",
    odooField: "item_weight_lbs",  // ✅
  },

  item_code: {
    namespace: "custom",
    key: "item_code",
    type: "single_line_text_field",
    odooField: "item_code",
  },
  code: {
    namespace: "custom",
    key: "code",
    type: "single_line_text_field",
    odooField: "code",
  },
  qty_available: {
    namespace: "custom",
    key: "qty_available",
    type: "number_integer",
    odooField: "qty_available",
  },
  ashley_item_name: {
    namespace: "custom",
    key: "ashley_item_name",
    type: "single_line_text_field",
    odooField: "ashley_item_name",
  },
  detailed_description: {
    namespace: "custom",
    key: "detailed_description",
    type: "multi_line_text_field",
    odooField: "detailed_description",
  },
  shade: {
    namespace: "custom",
    key: "shade",
    type: "single_line_text_field",
    odooField: "shade",
  },
  seat_count: {
    namespace: "custom",
    key: "seat_count",
    type: "number_decimal",
    odooField: "seat_count",
  },
  number_of_drawers: {
    namespace: "custom",
    key: "number_of_drawers",
    type: "single_line_text_field",
    odooField: "number_of_drawers",
  },
  lifestyle: {
    namespace: "custom",
    key: "lifestyle",
    type: "single_line_text_field",
    odooField: "lifestyle",
  },
  knockout: {
    namespace: "custom",
    key: "knockout",
    type: "url",
    odooField: "knockout",
  },
  large_image_url: {
    namespace: "custom",
    key: "large_image_url",
    type: "url",
    odooField: "large_image_url",
  },
  dimension_sketchs: {
    namespace: "custom",
    key: "dimension_sketchs",
    type: "url",
    odooField: "dimension_sketch",
  },
  ashley_status: {
    namespace: "custom",
    key: "ashley_status",
    type: "single_line_text_field",
    odooField: "ashley_status",
  },
  navigable_categories: {
    namespace: "custom",
    key: "navigable_categories",
    type: "multi_line_text_field",
    odooField: "navigable_categories",
  },
  parts_drawings_urls: {
    namespace: "custom",
    key: "parts_drawings_urls",
    type: "url",
    odooField: "parts_drawings_url",
  },
  color_swatch: {
    namespace: "custom",
    key: "color_swatchs",
    type: "url",
    odooField: "color_swatch",
  },
  item_room_image: {
    namespace: "custom",
    key: "item_room_image",
    type: "url",
    odooField: "item_room_image",
  },
  retail_type: {
    namespace: "custom",
    key: "retail_type",
    type: "single_line_text_field",
    odooField: "retail_type",
  },
  color: {
    namespace: "custom",
    key: "color",
    type: "single_line_text_field",
    odooField: "color",
  },
  items_per_case: {
    namespace: "custom",
    key: "items_per_case",
    type: "number_integer",
    odooField: "items_per_case",
  },
  item_assembly_you_tube_video_key1: {
    namespace: "custom",
    key: "youtube_video_1",
    type: "single_line_text_field",
    odooField: "x_item_assembly_you_tube_video_key1",
  },
  item_assembly_you_tube_video_key2: {
    namespace: "custom",
    key: "youtube_video_2",
    type: "single_line_text_field",
    odooField: "x_item_assembly_you_tube_video_key2",
  },
  item_assembly_you_tube_video_key3: {
    namespace: "custom",
    key: "youtube_video_3",
    type: "single_line_text_field",
    odooField: "x_item_assembly_you_tube_video_key3",
  }
};
