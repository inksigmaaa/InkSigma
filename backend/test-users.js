import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const postgresUsers = [
    { user: 'postgres', password: 'postgres' },
    { user: 'postgres', password: 'password' },
    { user: 'postgres', password: 'admin' },
    { user: 'postgres', password: '123456' },
    { user: 'postgres', password: 'root' },
    { user: 'postgres', password: 'naresh@07' },
    { user: 'postgres', password: 'Naresh@07' },
];

async function testPostgresUsers() {
    console.log("Testing PostgreSQL 18 default user combinations...\n");
    
    for (const { user, password } of postgresUsers) {
        try {
            const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@localhost:5432/inksigma_v1`;
            console.log(`Testing: ${user} with password: ${password}`);
            
            const pool = new Pool({ connectionString });
            const result = await pool.query("SELECT current_user, current_database(), version()");
            
            console.log("✅ SUCCESS!");
            console.log(`Connected as: ${result.rows[0].current_user}`);
            console.log(`Database: ${result.rows[0].current_database}`);
            console.log(`PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
            console.log(`Working connection string: ${connectionString}\n`);
            
            await pool.end();
            return connectionString;
        } catch (error) {
            console.log(`❌ Failed: ${error.message}\n`);
        }
    }
    
    console.log("❌ None of the common combinations worked.");
    console.log("Please check your pgAdmin connection settings for the correct password.");
    return null;
}

testPostgresUsers();