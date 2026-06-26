import { pgTable, text, timestamp, integer, pgEnum, boolean } from 'drizzle-orm/pg-core'
  import { createId } from '@paralleldrive/cuid2'

  export const raceEnum = pgEnum('race', ['chinese', 'malay', 'indian', 'other'])
  export const roomStatusEnum = pgEnum('room_status', ['available', 'booked'])
  export const viewingStatusEnum = pgEnum('viewing_status', [
    'new_customer', 'owner_confirmed', 'owner_rejected',
    'viewing_scheduled', 'viewing_done', 'booked', 'paid', 'moved_in', 'lost',
  ])
  export const rentPaymentStatusEnum = pgEnum('rent_payment_status', ['pending', 'paid'])

  export const rooms = pgTable('property_rooms', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    address: text('address').notNull(),
    photoUrl: text('photo_url'),
    cloudinaryPublicId: text('cloudinary_public_id'),
    status: roomStatusEnum('status').notNull().default('available'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  })

  export const leads = pgTable('property_leads', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    age: text('age'),
    phone: text('phone').notNull(),
    nationality: text('nationality'),
    race: raceEnum('race').notNull(),
    gender: text('gender'),
    occupation: text('occupation'),
    jobLocation: text('job_location'),
    budget: text('budget'),
    paxStaying: text('pax_staying'),
    moveInDate: text('move_in_date'),
    tenancyPeriod: text('tenancy_period'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  })

  export const viewings = pgTable('property_viewings', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    leadId: text('lead_id').notNull().references(() => leads.id),
    roomId: text('room_id').notNull().references(() => rooms.id),
    status: viewingStatusEnum('status').notNull().default('new_customer'),
    task: text('task'),
    taskChecked: boolean('task_checked').notNull().default(false),
    scheduledDate: timestamp('scheduled_date'),
    ownerRejectionReason: text('owner_rejection_reason'),
    confirmedMoveInDate: timestamp('confirmed_move_in_date'),
    payRentDay: integer('pay_rent_day'),
    payRentDurationMonths: integer('pay_rent_duration_months'),
    rentStartDate: timestamp('rent_start_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  })

  export const rentPayments = pgTable('property_rent_payments', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    viewingId: text('viewing_id').notNull().references(() => viewings.id),
    leadId: text('lead_id').notNull().references(() => leads.id),
    roomId: text('room_id').notNull().references(() => rooms.id),
    month: text('month').notNull(),
    dueDate: timestamp('due_date').notNull(),
    paidDate: timestamp('paid_date'),
    status: rentPaymentStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })
  