export interface RedisConfig {
    host: string;
    port: number;
    password: string | undefined;
    ttlSeconds: number;
}
declare const _default: (() => RedisConfig) & import("@nestjs/config").ConfigFactoryKeyHost<RedisConfig>;
export default _default;
