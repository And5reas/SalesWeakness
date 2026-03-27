import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Lead entity — represents a prospect entering the CRM pipeline.
 * tenant_id is present on every entity for RLS enforcement.
 */
@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tenant_id' })
  tenantId!: number;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId!: number | null;

  @Column({ name: 'first_name', length: 255 })
  firstName!: string;

  @Column({ name: 'last_name', length: 255 })
  lastName!: string;

  @Column({ length: 255 })
  email!: string;

  /** Lead origin channel: facebook_leads, landing_page, etc. (RF required) */
  @Column({ length: 100 })
  source!: string;

  /** Soft-delete flag — set to true after 180d without interaction (RF03) */
  @Column({ name: 'is_inactive', default: false })
  isInactive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** Monitored by inactivity Worker for 180d threshold */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
