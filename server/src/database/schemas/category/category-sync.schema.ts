import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategorySyncDocument = CategorySync & Document;

@Schema({ _id: false, timestamps: false })
export class CategorySync {
  @Prop({ type: Date, required: true, default: new Date() })
  localAt: Date;

  @Prop({ type: Boolean, required: true, default: false })
  loaded: boolean;

  @Prop({ type: Date })
  lastLoadedAt?: Date;

  @Prop({ type: Number })
  tableLine?: number;
}

export const CategorySyncSchema = SchemaFactory.createForClass(CategorySync);

/**
 *  Structure
 *    1. sync:
 *      1.1. localAt                -> With Microtron API
 *      1.2. loaded + lastLoadedAt  -> With Google Sheet
 *      1.3. tableLine              -> Google Sheet table line
 *
 *   Flow:
 *    1. Load Category to DB
 *      -> !! Set "localAt"
 *      -> find Parent Category and use him -> !! Set "parent", "parentPromId", "parentMicrotronId"
 *      -> update Child Categories
 *    2. Sync Local - Sync Categories between Constant Categories and Categories in DB
 *      2.1. Categories to ADD
 *        -> Add Categories -> !! Set "localAt"
 *        -> Make changes for Products
 *      2.2. Categories to REMOVE
 *        -> remove Category -> !! Decrease "tableLine" for other Categories
 *        -> remove Products as well
 *    3. Sync Course and Markup
 *      3.1. Sync Markup with Categories in Constant (by field: "markup")
 *        -> update Categories "markup" -> !! Set "localAt"
 *        -> update Products "price" as well
 *      3.2. Sync Categories course with Microtron API (by field: "course")
 *        -> update Categories "course" -> !! Set "localAt"
 *        -> update Products "price" as well
 *    4. Load / Reload Categories to Google Sheet
 *      4.1. Load Categories to Sheet
 *        -> !! Set "loaded" + "lastLoadedAt" + "tableLine"
 *      4.2. Reload Categories to Sheet
 *        -> !! Set to "loaded" false
 *        -> Select all Categories and load them to Sheet -> !! Set "loaded" + "lastLoadedAt" + "tableLine"
 * */
