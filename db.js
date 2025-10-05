// db.js - IndexedDB Cache Manager v4.1.0
class CacheDB {
    constructor() {
        this.dbName = 'SigmaTradeCache';
        this.version = 1;
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('💾 IndexedDB initialized');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('cache')) {
                    const store = db.createObjectStore('cache', { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('ttl', 'ttl', { unique: false });
                    console.log('💾 IndexedDB cache store created');
                }
            };
        });
    }
    
    async set(key, value, ttl = 300000) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            
            const data = {
                key: key,
                value: value,
                timestamp: Date.now(),
                ttl: ttl
            };
            
            return new Promise((resolve, reject) => {
                const request = store.put(data);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('IndexedDB set error:', error);
        }
    }
    
    async get(key, ttl = null) {
        if (!this.db) return null;
        
        try {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                
                request.onsuccess = () => {
                    const data = request.result;
                    
                    if (!data) {
                        resolve(null);
                        return;
                    }
                    
                    const age = Date.now() - data.timestamp;
                    const cacheTTL = ttl || data.ttl;
                    
                    if (age > cacheTTL) {
                        this.delete(key);
                        resolve(null);
                    } else {
                        resolve(data.value);
                    }
                };
                
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('IndexedDB get error:', error);
            return null;
        }
    }
    
    async delete(key) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            
            return new Promise((resolve, reject) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('IndexedDB delete error:', error);
        }
    }
    
    async clear() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            
            return new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => {
                    console.log('💾 IndexedDB cache cleared');
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('IndexedDB clear error:', error);
        }
    }
    
    async cleanup() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const index = store.index('timestamp');
            
            const now = Date.now();
            let cleanedCount = 0;
            
            return new Promise((resolve, reject) => {
                const request = index.openCursor();
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    
                    if (cursor) {
                        const data = cursor.value;
                        const age = now - data.timestamp;
                        
                        if (age > data.ttl) {
                            cursor.delete();
                            cleanedCount++;
                        }
                        
                        cursor.continue();
                    } else {
                        if (cleanedCount > 0) {
                            console.log(`💾 Cleaned ${cleanedCount} expired cache entries`);
                        }
                        resolve();
                    }
                };
                
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('IndexedDB cleanup error:', error);
        }
    }
}

// Export для использования
const cacheDB = new CacheDB();
