// ==============================================================================
// ORDER & PAYMENT REPOSITORY — SHOLKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery, withPostgresTransaction } from '@/lib/postgres';
import crypto from 'node:crypto';
import { StockUnavailableError } from '@/lib/errors';
import {
  InventoryChangeReason,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentGateway,
  PaymentStatus,
  Shipment,
  ShipmentStatus,
} from '@/types';

export interface OrderFilterOptions {
  userId?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

const toIso=(value:Date|string|null|undefined)=>value?new Date(value).toISOString():null;
function parseAddress(value:any){if(!value)return null;if(typeof value==='object')return value;try{return JSON.parse(value)}catch{return null}}
function mapDbOrderItem(r:any):OrderItem{return{id:r.id,orderId:r.orderId,variantId:r.variantId,productNameSnapshot:r.productNameSnapshot,variantSizeSnapshot:r.variantSizeSnapshot,skuSnapshot:r.skuSnapshot,unitPrice:Number(r.unitPrice),quantity:r.quantity,lineTotal:Number(r.lineTotal),productName:r.productNameSnapshot,variantLabel:r.variantSizeSnapshot,sku:r.skuSnapshot,totalPrice:Number(r.lineTotal)}}
function mapDbPayment(r:any):Payment{return{id:r.id,orderId:r.orderId,gateway:r.gateway,razorpayOrderId:r.razorpayOrderId??null,razorpayPaymentId:r.razorpayPaymentId??null,razorpaySignature:r.razorpaySignature??null,amount:Number(r.amount),currency:r.currency,status:r.status,gatewayResponse:r.gatewayResponse?parseAddress(r.gatewayResponse):null,refundId:r.refundId??null,refundAmount:r.refundAmount===null?null:Number(r.refundAmount),createdAt:toIso(r.createdAt)!,updatedAt:toIso(r.updatedAt)!}}
function mapDbShipment(r:any):Shipment{return{id:r.id,orderId:r.orderId,carrierName:r.carrierName,trackingNumber:r.trackingNumber,status:r.status,dispatchedAt:toIso(r.dispatchedAt),deliveredAt:toIso(r.deliveredAt),createdAt:toIso(r.createdAt)!,updatedAt:toIso(r.updatedAt)!,carrier:r.carrierName}}
function mapDbOrder(r:any,items:OrderItem[]=[],payment:Payment|null=null,shipment:Shipment|null=null):Order{return{id:r.id,orderNumber:r.orderNumber,userId:r.userId??null,customerName:r.customerName,customerEmail:r.customerEmail,customerPhone:r.customerPhone,shippingAddress:parseAddress(r.shippingAddress),billingAddress:parseAddress(r.billingAddress),subtotalAmount:Number(r.subtotalAmount),discountAmount:Number(r.discountAmount),couponCode:r.couponCode??null,couponDiscount:Number(r.couponDiscount),shippingFee:Number(r.shippingFee),taxAmount:Number(r.taxAmount),totalPayableAmount:Number(r.totalPayableAmount),orderStatus:r.orderStatus,paymentStatus:r.paymentStatus,paymentGateway:r.paymentGateway,adminNotes:r.adminNotes??null,createdAt:toIso(r.createdAt)!,updatedAt:toIso(r.updatedAt)!,items,payment,shipment,status:r.orderStatus,subtotal:Number(r.subtotalAmount),totalAmount:Number(r.totalPayableAmount),paymentMethod:r.paymentGateway,carrier:shipment?.carrierName??null,trackingNumber:shipment?.trackingNumber??null,trackingUrl:shipment?.trackingUrl??null}}
async function hydrateDbOrder(row:any):Promise<Order>{
  const [itemsResult,paymentResult,shipmentResult]=await Promise.all([
    pgQuery('SELECT * FROM "OrderItem" WHERE "orderId"=$1 ORDER BY "id"',[row.id]),
    pgQuery('SELECT * FROM "Payment" WHERE "orderId"=$1 LIMIT 1',[row.id]),
    pgQuery('SELECT * FROM "Shipment" WHERE "orderId"=$1 LIMIT 1',[row.id]),
  ]);
  const shipment=shipmentResult.rows[0]?mapDbShipment(shipmentResult.rows[0]):null;
  return mapDbOrder(row,itemsResult.rows.map(mapDbOrderItem),paymentResult.rows[0]?mapDbPayment(paymentResult.rows[0]):null,shipment);
}

export class OrderRepository {
  public static generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const count = db.orders.size + 10001;
    return `SV-${year}-${count}`;
  }

  public static async createOrder(
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'items' | 'payment' | 'shipment'>,
    itemsData: Array<Omit<OrderItem, 'id' | 'orderId'>>
  ): Promise<Order> {
    if (isPostgresConfigured()) {
      const id=`ord_${crypto.randomUUID()}`;
      await pgQuery('CREATE SEQUENCE IF NOT EXISTS "order_number_seq" START WITH 10001');
      await withPostgresTransaction(async(client)=>{
        const seq=await client.query(`SELECT nextval('"order_number_seq"') AS value`);
        const orderNumber=`SV-${new Date().getFullYear()}-${seq.rows[0].value}`;
        const now=new Date();
        await client.query('INSERT INTO "Order" ("id","orderNumber","userId","customerName","customerEmail","customerPhone","shippingAddress","billingAddress","subtotalAmount","discountAmount","couponCode","couponDiscount","shippingFee","taxAmount","totalPayableAmount","orderStatus","paymentStatus","paymentGateway","adminNotes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$20)', [id,orderNumber,orderData.userId??null,orderData.customerName,orderData.customerEmail,orderData.customerPhone,JSON.stringify(orderData.shippingAddress),orderData.billingAddress?JSON.stringify(orderData.billingAddress):null,orderData.subtotalAmount,orderData.discountAmount,orderData.couponCode??null,orderData.couponDiscount,orderData.shippingFee,orderData.taxAmount,orderData.totalPayableAmount,orderData.orderStatus,orderData.paymentStatus,orderData.paymentGateway,orderData.adminNotes??null,now]);
        for(const item of itemsData){await client.query('INSERT INTO "OrderItem" ("id","orderId","variantId","productNameSnapshot","variantSizeSnapshot","skuSnapshot","unitPrice","quantity","lineTotal") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[`item_${crypto.randomUUID()}`,id,item.variantId,item.productNameSnapshot,item.variantSizeSnapshot,item.skuSnapshot,item.unitPrice,item.quantity,item.lineTotal]);}
        await client.query('INSERT INTO "Payment" ("id","orderId","gateway","amount","currency","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$7)',[`pay_${id}`,id,orderData.paymentGateway,orderData.totalPayableAmount,'INR',PaymentStatus.PENDING,now]);
      });
      const saved=await this.findById(id);
      if(!saved)throw new Error('Created order could not be reloaded.');
      return saved;
    }
    const id = `ord_${crypto.randomUUID()}`;
    const orderNumber = this.generateOrderNumber();
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id,
      orderNumber,
      createdAt: now,
      updatedAt: now,
      items: [],
    };

    // Save Order Items
    const items: OrderItem[] = [];
    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];
      const itemId = `item_${id}_${i + 1}`;
      const newOrderItem: OrderItem = {
        ...item,
        id: itemId,
        orderId: id,
      };
      db.orderItems.set(itemId, newOrderItem);
      items.push(newOrderItem);
    }

    newOrder.items = items;
    db.orders.set(id, newOrder);

    // Initial Payment Record
    const paymentId = `pay_${id}`;
    const paymentRecord: Payment = {
      id: paymentId,
      orderId: id,
      gateway: orderData.paymentGateway,
      amount: orderData.totalPayableAmount,
      currency: 'INR',
      status: orderData.paymentGateway === PaymentGateway.CASH_ON_DELIVERY ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };
    db.payments.set(paymentId, paymentRecord);
    newOrder.payment = paymentRecord;

    return { ...newOrder };
  }

  public static async findById(id: string): Promise<Order | null> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "Order" WHERE "id"=$1 LIMIT 1',[id]); return r.rows[0]?hydrateDbOrder(r.rows[0]):null; }
    const order = db.orders.get(id);
    if (!order) return null;
    return this.populateOrder(order);
  }

  public static async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "Order" WHERE UPPER("orderNumber")=UPPER($1) LIMIT 1',[orderNumber.trim()]); return r.rows[0]?hydrateDbOrder(r.rows[0]):null; }
    const orders = Array.from(db.orders.values());
    for (const order of orders) {
      if (order.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase()) {
        return this.populateOrder(order);
      }
    }
    return null;
  }

  public static async listOrders(options: OrderFilterOptions = {}): Promise<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (isPostgresConfigured()) {
      const clauses:string[]=[];const values:unknown[]=[];const add=(column:string,value:unknown)=>{values.push(value);clauses.push(`${column}=$${values.length}`)};
      if(options.userId)add('"userId"',options.userId);
      if(options.orderStatus)add('"orderStatus"',options.orderStatus);
      if(options.paymentStatus)add('"paymentStatus"',options.paymentStatus);
      if(options.searchQuery){values.push(`%${options.searchQuery.trim()}%`);const n=values.length;clauses.push(`("orderNumber" ILIKE $${n} OR "customerName" ILIKE $${n} OR "customerEmail" ILIKE $${n} OR "customerPhone" ILIKE $${n})`)}
      const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
      const count=await pgQuery(`SELECT count(*)::int AS total FROM "Order" ${where}`,values);
      const total=count.rows[0]?.total||0,page=Math.max(1,options.page||1),limit=Math.max(1,options.limit||20),offset=(page-1)*limit;
      const rows=await pgQuery(`SELECT * FROM "Order" ${where} ORDER BY "createdAt" DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,limit,offset]);
      return {orders:await Promise.all(rows.rows.map(hydrateDbOrder)),total,page,totalPages:Math.ceil(total/limit)||1};
    }
    let list = Array.from(db.orders.values());

    if (options.userId) {
      list = list.filter((o) => o.userId === options.userId);
    }
    if (options.orderStatus) {
      list = list.filter((o) => o.orderStatus === options.orderStatus);
    }
    if (options.paymentStatus) {
      list = list.filter((o) => o.paymentStatus === options.paymentStatus);
    }
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 20);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit).map((o) => this.populateOrder(o));

    return {
      orders: paginated,
      total,
      page,
      totalPages,
    };
  }

  public static async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatus,
    adminNotes?: string | null
  ): Promise<Order | null> {
    if (isPostgresConfigured()) {
      const values:unknown[]=[orderId,orderStatus];let notesSql='';
      if(adminNotes!==undefined){values.push(adminNotes);notesSql=', "adminNotes"=$3';}
      const r=await pgQuery(`UPDATE "Order" SET "orderStatus"=$2,"updatedAt"=CURRENT_TIMESTAMP${notesSql} WHERE "id"=$1 RETURNING *`,values);
      return r.rows[0]?hydrateDbOrder(r.rows[0]):null;
    }
    const order = db.orders.get(orderId);
    if (!order) return null;

    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      orderStatus,
      adminNotes: adminNotes !== undefined ? adminNotes : order.adminNotes,
      updatedAt: now,
    };
    db.orders.set(orderId, updated);
    return this.populateOrder(updated);
  }

  public static async completePaymentAtomically(orderId:string,razorpayOrderId:string,razorpayPaymentId:string,razorpaySignature:string):Promise<{order:Order|null;alreadyPaid:boolean}>{
    if(!isPostgresConfigured())throw new Error('Atomic PostgreSQL payment completion is only available when DATABASE_URL is configured.');
    let alreadyPaid=false,found=false;
    await withPostgresTransaction(async(client)=>{
      const locked=await client.query('SELECT * FROM "Order" WHERE "id"=$1 FOR UPDATE',[orderId]);
      const order=locked.rows[0];if(!order)return;found=true;
      if(order.paymentStatus===PaymentStatus.PAID){alreadyPaid=true;return;}
      if(order.orderStatus===OrderStatus.CANCELLED)throw new Error('A cancelled order cannot be marked paid.');
      const payment=await client.query('SELECT "id","razorpayOrderId" FROM "Payment" WHERE "orderId"=$1 FOR UPDATE',[orderId]);
      if(!payment.rows[0]||payment.rows[0].razorpayOrderId!==razorpayOrderId)throw new Error('Payment record does not match this order.');
      const items=await client.query('SELECT * FROM "OrderItem" WHERE "orderId"=$1 ORDER BY "id" FOR UPDATE',[orderId]);
      for(const item of items.rows){
        const stock=await client.query('UPDATE "ProductVariant" SET "stockQuantity"="stockQuantity"-$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 AND "stockQuantity">=$2 RETURNING "stockQuantity"',[item.variantId,item.quantity]);
        if(!stock.rows[0]){const current=await client.query('SELECT "stockQuantity" FROM "ProductVariant" WHERE "id"=$1',[item.variantId]);throw new StockUnavailableError(item.skuSnapshot,item.quantity,current.rows[0]?.stockQuantity??0);}
        await client.query('INSERT INTO "InventoryLedger" ("id","variantId","changeQty","resultingQty","reason","referenceId","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)',[`inv_${crypto.randomUUID()}`,item.variantId,-item.quantity,stock.rows[0].stockQuantity,InventoryChangeReason.SALE,order.orderNumber,`Purchased under Order #${order.orderNumber}`]);
      }
      await client.query('UPDATE "Payment" SET "razorpayPaymentId"=$2,"razorpaySignature"=$3,"status"=$4,"updatedAt"=CURRENT_TIMESTAMP WHERE "orderId"=$1',[orderId,razorpayPaymentId,razorpaySignature,PaymentStatus.PAID]);
      await client.query('UPDATE "Order" SET "paymentStatus"=$2,"orderStatus"=$3,"adminNotes"=$4,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1',[orderId,PaymentStatus.PAID,OrderStatus.CONFIRMED,'Prepaid order verified successfully via Razorpay']);
    });
    return {order:found?await this.findById(orderId):null,alreadyPaid};
  }

  public static async updatePayment(
    orderId: string,
    updates: Partial<Payment>
  ): Promise<Payment | null> {
    if (isPostgresConfigured()) {
      return withPostgresTransaction(async(client)=>{
        const existing=await client.query('SELECT * FROM "Payment" WHERE "orderId"=$1 LIMIT 1',[orderId]);
        const old=existing.rows[0];
        const response=updates.gatewayResponse===undefined?old?.gatewayResponse:(typeof updates.gatewayResponse==='string'?updates.gatewayResponse:JSON.stringify(updates.gatewayResponse));
        const values=[updates.id||old?.id||`pay_${orderId}`,orderId,updates.gateway||old?.gateway||PaymentGateway.RAZORPAY,updates.razorpayOrderId===undefined?old?.razorpayOrderId??null:updates.razorpayOrderId,updates.razorpayPaymentId===undefined?old?.razorpayPaymentId??null:updates.razorpayPaymentId,updates.razorpaySignature===undefined?old?.razorpaySignature??null:updates.razorpaySignature,updates.amount??Number(old?.amount||0),updates.currency||old?.currency||'INR',updates.status||old?.status||PaymentStatus.PENDING,response??null,updates.refundId===undefined?old?.refundId??null:updates.refundId,updates.refundAmount===undefined?old?.refundAmount??null:updates.refundAmount,old?.createdAt||new Date()];
        const result=await client.query('INSERT INTO "Payment" ("id","orderId","gateway","razorpayOrderId","razorpayPaymentId","razorpaySignature","amount","currency","status","gatewayResponse","refundId","refundAmount","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,CURRENT_TIMESTAMP) ON CONFLICT ("orderId") DO UPDATE SET "gateway"=EXCLUDED."gateway","razorpayOrderId"=EXCLUDED."razorpayOrderId","razorpayPaymentId"=EXCLUDED."razorpayPaymentId","razorpaySignature"=EXCLUDED."razorpaySignature","amount"=EXCLUDED."amount","currency"=EXCLUDED."currency","status"=EXCLUDED."status","gatewayResponse"=EXCLUDED."gatewayResponse","refundId"=EXCLUDED."refundId","refundAmount"=EXCLUDED."refundAmount","updatedAt"=CURRENT_TIMESTAMP RETURNING *',[...values.slice(0,12),values[12]]);
        if(updates.status)await client.query('UPDATE "Order" SET "paymentStatus"=$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1',[orderId,updates.status]);
        return mapDbPayment(result.rows[0]);
      });
    }
    let paymentRecord: Payment | null = null;
    const payments = Array.from(db.payments.values());
    for (const p of payments) {
      if (p.orderId === orderId) {
        paymentRecord = p;
        break;
      }
    }

    const now = new Date().toISOString();
    if (!paymentRecord) {
      paymentRecord = {
        id: `pay_${orderId}`,
        orderId,
        gateway: PaymentGateway.RAZORPAY,
        amount: updates.amount || 0,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        createdAt: now,
        updatedAt: now,
        ...updates,
      };
      db.payments.set(paymentRecord.id, paymentRecord);
    } else {
      paymentRecord = {
        ...paymentRecord,
        ...updates,
        updatedAt: now,
      };
      db.payments.set(paymentRecord.id, paymentRecord);
    }

    // Sync order payment status
    if (updates.status) {
      const order = db.orders.get(orderId);
      if (order) {
        db.orders.set(orderId, {
          ...order,
          paymentStatus: updates.status,
          updatedAt: now,
        });
      }
    }

    return { ...paymentRecord };
  }

  public static async updateShipment(
    orderId: string,
    carrierName: string,
    trackingNumber: string,
    status: ShipmentStatus = ShipmentStatus.IN_TRANSIT
  ): Promise<Shipment> {
    if (isPostgresConfigured()) {
      const shipment=await withPostgresTransaction(async(client)=>{
        const id=`shp_${orderId}`;
        const r=await client.query('INSERT INTO "Shipment" ("id","orderId","carrierName","trackingNumber","status","dispatchedAt","deliveredAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,CASE WHEN $5=$6 THEN CURRENT_TIMESTAMP ELSE NULL END,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("orderId") DO UPDATE SET "carrierName"=EXCLUDED."carrierName","trackingNumber"=EXCLUDED."trackingNumber","status"=EXCLUDED."status","deliveredAt"=CASE WHEN EXCLUDED."status"=$6 THEN CURRENT_TIMESTAMP ELSE "Shipment"."deliveredAt" END,"updatedAt"=CURRENT_TIMESTAMP RETURNING *',[id,orderId,carrierName,trackingNumber,status,ShipmentStatus.DELIVERED]);
        const newStatus=status===ShipmentStatus.DELIVERED?OrderStatus.DELIVERED:OrderStatus.SHIPPED;
        await client.query('UPDATE "Order" SET "orderStatus"=$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 AND "orderStatus"<>$3',[orderId,newStatus,OrderStatus.DELIVERED]);
        return mapDbShipment(r.rows[0]);
      });
      return shipment;
    }
    const now = new Date().toISOString();
    let shipment: Shipment | null = null;
    const shipments = Array.from(db.shipments.values());
    for (const s of shipments) {
      if (s.orderId === orderId) {
        shipment = s;
        break;
      }
    }

    if (!shipment) {
      shipment = {
        id: `shp_${orderId}`,
        orderId,
        carrierName,
        trackingNumber,
        status,
        dispatchedAt: now,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      shipment = {
        ...shipment,
        carrierName,
        trackingNumber,
        status,
        updatedAt: now,
      };
    }
    db.shipments.set(shipment.id, shipment);

    // Sync order status to SHIPPED if not already
    const order = db.orders.get(orderId);
    if (order && order.orderStatus !== OrderStatus.DELIVERED) {
      db.orders.set(orderId, {
        ...order,
        orderStatus: status === ShipmentStatus.DELIVERED ? OrderStatus.DELIVERED : OrderStatus.SHIPPED,
        updatedAt: now,
      });
    }

    return { ...shipment };
  }

  public static async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    if (isPostgresConfigured()) {
      const r=await pgQuery('SELECT EXISTS (SELECT 1 FROM "Order" o JOIN "OrderItem" oi ON oi."orderId"=o."id" JOIN "ProductVariant" v ON v."id"=oi."variantId" WHERE o."userId"=$1 AND o."paymentStatus"=$2 AND v."productId"=$3) AS purchased',[userId,PaymentStatus.PAID,productId]);
      return Boolean(r.rows[0]?.purchased);
    }
    const orders = Array.from(db.orders.values());
    for (const order of orders) {
      if (order.userId === userId && order.paymentStatus === PaymentStatus.PAID) {
        const orderItems = Array.from(db.orderItems.values()).filter((i) => i.orderId === order.id);
        for (const item of orderItems) {
          const variant = db.productVariants.get(item.variantId);
          if (variant && variant.productId === productId) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private static populateOrder(order: Order): Order {
    const rawItems = Array.from(db.orderItems.values()).filter((i) => i.orderId === order.id);
    const items = rawItems.map((item) => ({
      ...item,
      productName: item.productNameSnapshot,
      variantLabel: item.variantSizeSnapshot,
      sku: item.skuSnapshot,
      totalPrice: item.lineTotal,
    }));

    let payment: Payment | null = null;
    const payments = Array.from(db.payments.values());
    for (const p of payments) {
      if (p.orderId === order.id) {
        payment = p;
        break;
      }
    }
    let shipment: Shipment | null = null;
    const shipments = Array.from(db.shipments.values());
    for (const s of shipments) {
      if (s.orderId === order.id) {
        shipment = s;
        break;
      }
    }

    return {
      ...order,
      status: order.orderStatus,
      subtotal: order.subtotalAmount,
      totalAmount: order.totalPayableAmount,
      paymentMethod: order.paymentGateway,
      carrier: shipment?.carrier || shipment?.carrierName || null,
      trackingNumber: shipment?.trackingNumber || null,
      trackingUrl: shipment?.trackingUrl || null,
      items,
      payment,
      shipment,
    };
  }

  // Aliases & Instance Methods
  public static async findMany(options?: OrderFilterOptions) { return this.listOrders(options); }

  public findMany(options?: OrderFilterOptions) { return OrderRepository.findMany(options); }
  public findById(id: string) { return OrderRepository.findById(id); }
  public findByOrderNumber(orderNumber: string) { return OrderRepository.findByOrderNumber(orderNumber); }
  public listOrders(options?: OrderFilterOptions) { return OrderRepository.listOrders(options); }
  public createOrder(orderData: any, itemsData: any[]) { return OrderRepository.createOrder(orderData, itemsData); }
  public updateStatus(id: string, status: any) { return OrderRepository.updateOrderStatus(id, status); }
  public updateOrderStatus(id: string, status: any, notes?: string) { return OrderRepository.updateOrderStatus(id, status, notes); }
  public updatePayment(orderId: string, updates: any) { return OrderRepository.updatePayment(orderId, updates); }
  public updateShipment(orderId: string, carrier: string, trackingNumber: string, status?: any) { return OrderRepository.updateShipment(orderId, carrier, trackingNumber, status); }
  public hasUserPurchasedProduct(userId: string, productId: string) { return OrderRepository.hasUserPurchasedProduct(userId, productId); }
}

export const orderRepository = new OrderRepository();

