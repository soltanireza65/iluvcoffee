module.exports = {
    type: 'postgres',
    host: '0.0.0.0',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'postgres',
    entities: ['dist/**/*.entity.ts'],
    migrations: ['dist/migrations/*.js'],
    cli: {
        migrationsDir: 'src/migrations'
    }
    // autoLoadEntities: true,
    // synchronize: true,
    // synchronize: process.env.NODE_ENV === "development",
}