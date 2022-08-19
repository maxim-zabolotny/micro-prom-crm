import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductSyncDocument = ProductSync & Document;

@Schema({ _id: false, timestamps: false })
export class ProductSync {
  @Prop({ type: Date, required: true, default: new Date() })
  localAt: Date;

  @Prop({ type: Boolean, required: true, default: false })
  prom: boolean;

  @Prop({ type: Date })
  lastPromAt?: Date;

  @Prop({ type: Boolean, required: true, default: false })
  loaded: boolean;

  @Prop({ type: Date })
  lastLoadedAt?: Date;

  @Prop({ type: Number })
  tableLine?: number;
}

export const ProductSyncSchema = SchemaFactory.createForClass(ProductSync);

/**
 *  Structure
 *    1. sync:
 *      1.1. localAt                    -> With Microtron API
 *      1.2. prom + lastPromAt          -> With Prom API (+ and after loading to table)
 *      1.3. loaded + lastLoadedAt      -> With Google Sheet
 *      1.4. tableLine                  -> Google Sheet table line
 *
 *  Flow:
 *    1. Load Products to DB
 *      -> !! Set "localAt"
 *    2. Sync Local
 *      2.1. Products to ADD
 *        -> !! Set "localAt"
 *      2.2. Products to UPDATE
 *        -> !! Set "localAt" + "prom" false
 *      2.3. Products to REMOVE
 *        -> Remove local -> !! Decrease "tableLine" for other Products
 *        -> Make as deleted in Prom
 *    3. Sync Course and Markup
 *      3.1. Course
 *        -> !! Set "localAt" + "prom" false
 *      3.2. Markup
 *        -> !! Set "localAt" + "prom" false
 *    4. Sync Prom
 *      4.1. Update
 *        -> !! Set "prom" true + "lastPromAt"
 *      4.2. Delete
 *        -> Use API for deleting
 *    5. Load / Reload Products to Google Sheet
 *      5.1. Load Products to Sheet
 *        -> !! Set "loaded" + "lastLoadedAt" + "tableLine" + "prom" + "lastPromAt"
 *      5.2. Reload Products to Sheet
 *        -> !! Set to "loaded" false
 *        -> Select all Products and load them to Sheet -> !! Set "loaded" + "lastLoadedAt" + "tableLine" + "prom" + "lastPromAt"
 * */
