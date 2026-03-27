import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Tenant entity — represents a SaaS customer account.
 * All other entities have a tenant_id FK referencing this.
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  /** Subscription plan: free | starter | professional | enterprise */
  @Column({ default: 'starter' })
  plan!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
