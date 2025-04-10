/**
 * Thư viện Sticker cho PhotoBooth
 * Quản lý và cung cấp stickers cho ứng dụng
 */

class PhotoStickers {
    constructor() {
        this.categories = {
            face: {
                name: "Khuôn mặt",
                icon: "fas fa-smile",
                stickers: [
                    { id: "sunglasses", name: "Kính mát", path: "stickers/sunglasses.png" },
                    { id: "hat", name: "Mũ", path: "stickers/hat.png" },
                    { id: "mustache", name: "Râu", path: "stickers/mustache.png" },
                    { id: "crown", name: "Vương miện", path: "stickers/crown.png" },
                    { id: "mask", name: "Mặt nạ", path: "stickers/mask.png" },
                    { id: "beard", name: "Râu dài", path: "stickers/beard.png" }
                ]
            },
            cute: {
                name: "Dễ thương",
                icon: "fas fa-heart",
                stickers: [
                    { id: "heart", name: "Trái tim", path: "stickers/heart.png" },
                    { id: "star", name: "Ngôi sao", path: "stickers/star.png" },
                    { id: "butterfly", name: "Bướm", path: "stickers/butterfly.png" },
                    { id: "flower", name: "Hoa", path: "stickers/flower.png" },
                    { id: "rainbow", name: "Cầu vồng", path: "stickers/rainbow.png" },
                    { id: "unicorn", name: "Kỳ lân", path: "stickers/unicorn.png" }
                ]
            },
            speech: {
                name: "Lời thoại",
                icon: "fas fa-comment",
                stickers: [
                    { id: "speech1", name: "Lời nói 1", path: "stickers/speech1.png" },
                    { id: "speech2", name: "Lời nói 2", path: "stickers/speech2.png" },
                    { id: "speech3", name: "Lời nói 3", path: "stickers/speech3.png" },
                    { id: "speech4", name: "Lời nói 4", path: "stickers/speech4.png" }
                ]
            },
            emoji: {
                name: "Biểu cảm",
                icon: "fas fa-grin-stars",
                stickers: [
                    { id: "emoji-love", name: "Yêu", path: "stickers/emoji-love.png" },
                    { id: "emoji-smile", name: "Cười", path: "stickers/emoji-smile.png" },
                    { id: "emoji-laugh", name: "Cười lớn", path: "stickers/emoji-laugh.png" },
                    { id: "emoji-cool", name: "Ngầu", path: "stickers/emoji-cool.png" }
                ]
            }
        };
        
        // Cache stickers đã tải để tái sử dụng
        this.loadedStickers = {};
    }
    
    // Lấy tất cả các danh mục sticker
    getAllCategories() {
        return this.categories;
    }
    
    // Lấy sticker theo ID
    getSticker(id) {
        for (const category of Object.values(this.categories)) {
            const sticker = category.stickers.find(s => s.id === id);
            if (sticker) return sticker;
        }
        return null;
    }
    
    // Tải trước tất cả stickers
    preloadStickers() {
        const promises = [];
        
        for (const category of Object.values(this.categories)) {
            for (const sticker of category.stickers) {
                promises.push(this.loadSticker(sticker.id));
            }
        }
        
        return Promise.all(promises);
    }
    
    // Tải một sticker
    loadSticker(stickerId) {
        return new Promise((resolve, reject) => {
            const sticker = this.getSticker(stickerId);
            
            if (!sticker) {
                reject(new Error(`Không tìm thấy sticker có ID: ${stickerId}`));
                return;
            }
            
            // Nếu đã tải rồi, trả về từ cache
            if (this.loadedStickers[stickerId]) {
                resolve(this.loadedStickers[stickerId]);
                return;
            }
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.loadedStickers[stickerId] = img;
                resolve(img);
            };
            
            img.onerror = () => {
                reject(new Error(`Lỗi khi tải sticker: ${stickerId}`));
            };
            
            img.src = sticker.path;
        });
    }
    
    // Vẽ sticker lên canvas
    drawSticker(ctx, stickerId, x, y, width, height, rotation = 0) {
        return new Promise((resolve, reject) => {
            this.loadSticker(stickerId)
                .then(img => {
                    ctx.save();
                    
                    // Di chuyển đến vị trí cần vẽ
                    ctx.translate(x + width/2, y + height/2);
                    
                    // Xoay sticker nếu cần
                    if (rotation) {
                        ctx.rotate(rotation * Math.PI / 180);
                    }
                    
                    // Vẽ sticker
                    ctx.drawImage(img, -width/2, -height/2, width, height);
                    
                    ctx.restore();
                    resolve();
                })
                .catch(reject);
        });
    }
}

// Export thư viện stickers
window.PhotoStickers = new PhotoStickers();
