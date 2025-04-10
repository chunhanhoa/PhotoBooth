/**
 * Thư viện bộ lọc PhotoBooth
 * Cung cấp các bộ lọc và hiệu ứng khác nhau cho ứng dụng
 */

class PhotoFilters {
    constructor() {
        this.filters = {
            normal: {
                name: "Bình thường",
                filter: "none",
                icon: "fas fa-sun",
                preview: "normal-preview.jpg"
            },
            grayscale: {
                name: "Đen trắng",
                filter: "grayscale(100%)",
                icon: "fas fa-adjust",
                preview: "grayscale-preview.jpg"
            },
            sepia: {
                name: "Sepia",
                filter: "sepia(100%)",
                icon: "fas fa-history",
                preview: "sepia-preview.jpg"
            },
            invert: {
                name: "Đảo màu",
                filter: "invert(80%)",
                icon: "fas fa-exchange-alt",
                preview: "invert-preview.jpg"
            },
            vintage: {
                name: "Vintage",
                filter: "sepia(30%) saturate(140%) brightness(0.9) contrast(1.2)",
                icon: "fas fa-camera-retro",
                preview: "vintage-preview.jpg"
            },
            pastel: {
                name: "Pastel",
                filter: "brightness(1.1) saturate(1.3) contrast(0.9)",
                icon: "fas fa-paint-brush",
                preview: "pastel-preview.jpg"
            },
            cute: {
                name: "Cute",
                filter: "brightness(1.1) saturate(1.5) contrast(0.85) hue-rotate(10deg)",
                icon: "fas fa-heart",
                preview: "cute-preview.jpg"
            },
            cool: {
                name: "Mát lạnh",
                filter: "brightness(1) saturate(1) contrast(1.1) hue-rotate(180deg)",
                icon: "fas fa-snowflake",
                preview: "cool-preview.jpg"
            },
            warm: {
                name: "Ấm áp",
                filter: "brightness(1.1) saturate(1.3) contrast(0.9) hue-rotate(350deg) sepia(20%)",
                icon: "fas fa-fire",
                preview: "warm-preview.jpg"
            },
            dramatic: {
                name: "Kịch tính",
                filter: "brightness(0.9) saturate(1.5) contrast(1.4) hue-rotate(0deg)",
                icon: "fas fa-theater-masks",
                preview: "dramatic-preview.jpg"
            },
            noir: {
                name: "Film Noir",
                filter: "grayscale(100%) contrast(1.2) brightness(0.9)",
                icon: "fas fa-film",
                preview: "noir-preview.jpg"
            },
            cyber: {
                name: "Cyber",
                filter: "hue-rotate(270deg) saturate(1.5) brightness(1.1) contrast(1.1)",
                icon: "fas fa-robot",
                preview: "cyber-preview.jpg"
            },
            dream: {
                name: "Mơ màng",
                filter: "brightness(1.1) saturate(0.8) contrast(0.8) blur(1px)",
                icon: "fas fa-cloud",
                preview: "dream-preview.jpg"
            },
            bloom: {
                name: "Bloom",
                filter: "brightness(1.15) contrast(0.9) saturate(1.2)",
                icon: "fas fa-spa",
                preview: "bloom-preview.jpg"
            }
        };
    }
    
    // Lấy tất cả các bộ lọc
    getAll() {
        return this.filters;
    }
    
    // Lấy thông tin bộ lọc theo tên
    get(name) {
        return this.filters[name] || this.filters.normal;
    }
    
    // Áp dụng bộ lọc lên canvas
    applyFilter(canvas, filterName) {
        const ctx = canvas.getContext('2d');
        const filter = this.get(filterName).filter;
        
        if (filterName === 'normal') return canvas;
        
        // Lưu ảnh gốc
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Tạo canvas tạm thời để áp dụng filter
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Vẽ ảnh gốc lên canvas tạm
        tempCtx.putImageData(imageData, 0, 0);
        
        // Xóa canvas gốc
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Áp dụng filter và vẽ lên canvas gốc
        ctx.filter = filter;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.filter = 'none';
        
        return canvas;
    }
    
    // Tạo hình ảnh xem trước cho filter
    createPreviewImage(filterName, baseImgUrl, width, height) {
        return new Promise((resolve, reject) => {
            const filter = this.get(filterName).filter;
            const canvas = document.createElement('canvas');
            canvas.width = width || 100;
            canvas.height = height || 100;
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                ctx.filter = filter;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = reject;
            img.src = baseImgUrl;
        });
    }
    
    // Tạo CSS cho các filter
    generateFilterCSS() {
        let css = '';
        for (const [key, value] of Object.entries(this.filters)) {
            css += `.filter-${key} { filter: ${value.filter}; }\n`;
        }
        return css;
    }
}

// Hiệu ứng đặc biệt (không phải filter)
class PhotoEffects {
    constructor() {
        this.effects = {
            frame: {
                classic: {
                    name: "Khung cổ điển",
                    draw: function(ctx, width, height) {
                        const frameWidth = 20;
                        ctx.strokeStyle = '#daa520';
                        ctx.lineWidth = frameWidth;
                        ctx.strokeRect(frameWidth/2, frameWidth/2, width-frameWidth, height-frameWidth);
                    }
                },
                polaroid: {
                    name: "Polaroid",
                    draw: function(ctx, width, height) {
                        const frameWidth = 20;
                        const bottomFrame = 60;
                        
                        // Vẽ khung trắng
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, width, height + bottomFrame);
                        
                        // Vẽ viền đen mờ
                        ctx.shadowColor = "rgba(0,0,0,0.3)";
                        ctx.shadowBlur = 15;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 5;
                        
                        // Vẽ ảnh ở giữa khung
                        ctx.fillStyle = "#CCC";
                        ctx.fillRect(frameWidth, frameWidth, width - frameWidth * 2, height - frameWidth * 2);
                        
                        // Reset shadow
                        ctx.shadowColor = "transparent";
                    }
                },
                hearts: {
                    name: "Trái tim",
                    draw: function(ctx, width, height) {
                        // Vẽ viền trái tim xung quanh
                        const heartSize = 30;
                        const hearts = Math.floor((width + height) / heartSize);
                        const colors = ['#ff6b6b', '#ff8e8e', '#ffb6b6'];
                        
                        for (let i = 0; i < hearts; i++) {
                            const x = Math.random() * width;
                            const y = Math.random() * height;
                            const size = heartSize * (0.5 + Math.random() * 0.5);
                            const rotation = Math.random() * Math.PI;
                            
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.rotate(rotation);
                            ctx.fillStyle = colors[i % colors.length];
                            ctx.globalAlpha = 0.7;
                            
                            // Vẽ trái tim
                            ctx.beginPath();
                            ctx.moveTo(0, 0);
                            ctx.bezierCurveTo(size/4, -size/2, size, -size/2, size, 0);
                            ctx.bezierCurveTo(size, size/2, size/2, size, 0, size*1.5);
                            ctx.bezierCurveTo(-size/2, size, -size, size/2, -size, 0);
                            ctx.bezierCurveTo(-size, -size/2, -size/4, -size/2, 0, 0);
                            ctx.fill();
                            
                            ctx.restore();
                        }
                    }
                }
            },
            overlay: {
                confetti: {
                    name: "Hoa giấy",
                    draw: function(ctx, width, height) {
                        const pieces = 100;
                        const colors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590'];
                        
                        for (let i = 0; i < pieces; i++) {
                            const x = Math.random() * width;
                            const y = Math.random() * height;
                            const size = 3 + Math.random() * 7;
                            const color = colors[Math.floor(Math.random() * colors.length)];
                            
                            ctx.fillStyle = color;
                            ctx.globalAlpha = 0.6;
                            
                            // Vẽ hình vuông/chữ nhật
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.rotate(Math.random() * Math.PI * 2);
                            ctx.fillRect(-size/2, -size/2, size, size * (0.5 + Math.random()));
                            ctx.restore();
                        }
                        
                        ctx.globalAlpha = 1.0;
                    }
                },
                sparkles: {
                    name: "Lấp lánh",
                    draw: function(ctx, width, height) {
                        const stars = 50;
                        
                        for (let i = 0; i < stars; i++) {
                            const x = Math.random() * width;
                            const y = Math.random() * height;
                            const size = 1 + Math.random() * 3;
                            const opacity = 0.5 + Math.random() * 0.5;
                            
                            // Vẽ ngôi sao
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.rotate(Math.PI / 4);
                            
                            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                            
                            // Chấm sáng
                            ctx.beginPath();
                            ctx.arc(0, 0, size, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // Tia sáng
                            ctx.beginPath();
                            ctx.moveTo(-size*3, 0);
                            ctx.lineTo(size*3, 0);
                            ctx.moveTo(0, -size*3);
                            ctx.lineTo(0, size*3);
                            ctx.lineWidth = size / 2;
                            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
                            ctx.stroke();
                            
                            ctx.restore();
                        }
                    }
                }
            }
        };
    }
    
    // Áp dụng hiệu ứng khung
    applyFrame(canvas, frameName) {
        const ctx = canvas.getContext('2d');
        const frame = this.effects.frame[frameName];
        if (!frame) return canvas;
        
        // Tạo bản sao của canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);
        
        // Xóa canvas gốc và vẽ khung
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frame.draw(ctx, canvas.width, canvas.height);
        
        // Vẽ lại ảnh lên trên
        const margin = 20;
        ctx.drawImage(tempCanvas, margin, margin, canvas.width - margin*2, canvas.height - margin*2);
        
        return canvas;
    }
    
    // Áp dụng hiệu ứng overlay
    applyOverlay(canvas, overlayName) {
        const ctx = canvas.getContext('2d');
        const overlay = this.effects.overlay[overlayName];
        if (!overlay) return canvas;
        
        // Áp dụng overlay trực tiếp lên canvas
        overlay.draw(ctx, canvas.width, canvas.height);
        
        return canvas;
    }
}

// Export thư viện filter
window.PhotoFilters = new PhotoFilters();
window.PhotoEffects = new PhotoEffects();
