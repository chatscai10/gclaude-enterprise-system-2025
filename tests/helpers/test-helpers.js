/**
 * 測試輔助函式
 */

const request = require('supertest');
const path = require('path');

class TestHelpers {
    static async createTestUser(userData = {}) {
        return {
            id: Date.now(),
            username: 'testuser',
            password: 'testpass123',
            role: 'employee',
            ...userData
        };
    }
    
    static async loginUser(app, credentials = {}) {
        const loginData = {
            username: 'admin',
            password: 'admin123',
            ...credentials
        };
        
        const response = await request(app)
            .post('/api/auth/login')
            .send(loginData);
            
        return response;
    }
    
    static async createTestEmployee(employeeData = {}) {
        return {
            id: Date.now(),
            name: '測試員工',
            position: '測試職位',
            department: '測試部門',
            salary: 50000,
            ...employeeData
        };
    }
    
    static generateTestData(type, count = 1) {
        const generators = {
            employee: () => ({
                name: `測試員工${Math.floor(Math.random() * 1000)}`,
                position: '測試職位',
                department: '測試部門',
                salary: Math.floor(Math.random() * 100000) + 30000
            }),
            attendance: () => ({
                employeeId: Math.floor(Math.random() * 100),
                date: new Date().toISOString().split('T')[0],
                checkIn: '09:00',
                checkOut: '18:00',
                status: 'present'
            }),
            revenue: () => ({
                date: new Date().toISOString().split('T')[0],
                amount: Math.floor(Math.random() * 100000),
                source: '測試收入',
                category: 'test'
            })
        };
        
        const generator = generators[type];
        if (!generator) {
            throw new Error(`Unknown data type: ${type}`);
        }
        
        return Array.from({ length: count }, generator);
    }
    
    static async waitForServer(url, maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(url + '/api/health');
                if (response.ok) {
                    return true;
                }
            } catch (error) {
                // 伺服器還沒準備好
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error(`Server at ${url} not ready after ${maxAttempts} attempts`);
    }
    
    static createMockResponse() {
        return {
            json: jest.fn(() => Promise.resolve({})),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
    }
    
    static createMockRequest(data = {}) {
        return {
            body: data.body || {},
            params: data.params || {},
            query: data.query || {},
            headers: data.headers || {},
            user: data.user || null
        };
    }
}

module.exports = TestHelpers;