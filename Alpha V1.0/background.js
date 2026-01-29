// background.js - Otomatik kaydetme arkaplan servisi

// Chrome başladığında veya eklenti yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
    console.log('TabSync Alpha yüklendi');
    
    // Varsayılan ayarları yükle
    chrome.storage.local.get(['autoSaveEnabled', 'saveInterval'], (result) => {
        if (result.autoSaveEnabled === undefined) {
            // İlk yükleme - varsayılan ayarları kaydet
            chrome.storage.local.set({
                autoSaveEnabled: false,
                saveInterval: 5  // dakika
            });
        } else if (result.autoSaveEnabled) {
            // Otomatik kaydetme açıksa alarmı başlat
            startAutoSave(result.saveInterval || 5);
        }
    });
});

// Alarm tetiklendiğinde (otomatik kaydetme zamanı geldiğinde)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'autoSaveTabs') {
        autoSaveAllTabs();
    }
});

// Tüm sekmeleri otomatik kaydet
async function autoSaveAllTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        
        const validTabs = tabs.filter(tab => 
            tab.url && 
            !tab.url.startsWith('chrome://') && 
            !tab.url.startsWith('chrome-extension://')
        );
        
        const tabsData = validTabs.map(tab => ({
            title: tab.title || 'Başlıksız Sekme',
            url: tab.url,
            favIconUrl: tab.favIconUrl || ''
        }));
        
        const now = new Date();
        const saveData = {
            tabs: tabsData,
            savedAt: now.toLocaleString('tr-TR'),
            timestamp: now.getTime(),
            totalTabs: tabsData.length,
            version: 'Alpha-1.0',
            autoSaved: true  // Otomatik kaydedildiğini belirt
        };
        
        await chrome.storage.local.set({ 
            'lastSavedTabs': saveData 
        });
        
        console.log(`⏰ Otomatik kaydedildi: ${tabsData.length} sekme`);
        
        // Bildirim göster (opsiyonel)
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'TabSync - Otomatik Kaydedildi',
            message: `${tabsData.length} sekme kaydedildi`
        });
        
    } catch (error) {
        console.error('Otomatik kaydetme hatası:', error);
    }
}

// Otomatik kaydetme alarmını başlat
function startAutoSave(intervalMinutes) {
    // Önce eski alarmı temizle
    chrome.alarms.clear('autoSaveTabs');
    
    // Yeni alarm oluştur
    chrome.alarms.create('autoSaveTabs', {
        periodInMinutes: parseInt(intervalMinutes)
    });
    
    console.log(`⏰ Otomatik kaydetme başlatıldı: her ${intervalMinutes} dakika`);
}

// Otomatik kaydetmeyi durdur
function stopAutoSave() {
    chrome.alarms.clear('autoSaveTabs');
    console.log('⏰ Otomatik kaydetme durduruldu');
}

// Popup'tan mesaj geldiğinde
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateAutoSave') {
        if (request.enabled) {
            startAutoSave(request.interval);
        } else {
            stopAutoSave();
        }
        sendResponse({ success: true });
    }
    
    if (request.action === 'getAutoSaveStatus') {
        chrome.storage.local.get(['autoSaveEnabled', 'saveInterval'], (result) => {
            sendResponse({
                enabled: result.autoSaveEnabled || false,
                interval: result.saveInterval || 5
            });
        });
        return true; // Async response için
    }
});