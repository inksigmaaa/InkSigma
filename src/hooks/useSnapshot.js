import { useState, useCallback } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { toast } from "sonner";

// 1x1 transparent pixel to replace failing images
const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const convertImageToBase64 = async (img) => {
  try {
    const src = img.src;
     // Skip data URLs and relative paths that might be local (though fetch handles relative fine, let's be safe)
    if (!src || src.startsWith('data:')) return null;

    // Fetch the image as a blob
    const response = await fetch(src, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache', // Bypass cache to ensure fresh headers
    });

    if (!response.ok) throw new Error(`Failed to fetch ${src}`);

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to convert image to base64, using placeholder:', img.src);
    return TRANSPARENT_PIXEL; // Fallback to transparent pixel so snapshot doesn't crash
  }
};

const preprocessDom = async (element) => {
  const images = Array.from(element.querySelectorAll('img'));
  const originalState = new Map();

  await Promise.all(images.map(async (img) => {
    // Save original state - store the actual current values
    const currentSrc = img.getAttribute('src') || img.src;
    const currentSrcset = img.getAttribute('srcset') || '';
    const currentLoading = img.getAttribute('loading') || 'auto';
    
    originalState.set(img, {
      src: currentSrc,
      srcset: currentSrcset,
      loading: currentLoading,
    });

    // Disable lazy loading and clear srcset which can confuse things
    img.setAttribute('loading', 'eager');
    img.removeAttribute('srcset');
    
    // Convert to base64
    const base64 = await convertImageToBase64(img);
    if (base64) {
      img.setAttribute('src', base64);
    }
  }));

  return () => {
    // Restore function - properly restore all attributes
    originalState.forEach((state, img) => {
      if (state.src) {
        img.setAttribute('src', state.src);
      }
      if (state.srcset) {
        img.setAttribute('srcset', state.srcset);
      } else {
        img.removeAttribute('srcset');
      }
      if (state.loading && state.loading !== 'auto') {
        img.setAttribute('loading', state.loading);
      } else {
        img.removeAttribute('loading');
      }
    });
  };
};

export const useSnapshot = () => {
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const captureSnapshot = useCallback(async (elementRef, title = 'blog-snapshot', options = {}) => {
    if (!elementRef.current) return;

    const { returnDataUrl = false, height = null, width = null, x = 0, y = 0 } = options;
    let restoreDom = null;

    try {
      setIsSnapshotting(true);
      elementRef.current.classList.add('snapshot-mode');

      // Pre-process: Convert all images to local base64 to avoid CORS/Network errors during capture
      restoreDom = await preprocessDom(elementRef.current);

      // Calculate the full element dimensions for initial capture
      const fullWidth = elementRef.current.scrollWidth;
      const fullHeight = elementRef.current.scrollHeight;

      const config = {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: fullWidth,
        height: fullHeight,
        skipFonts: true,
        style: {
          transform: 'none',
        },
        filter: (node) => {
          const tagName = (node.tagName || '').toLowerCase();
          return tagName !== 'iframe' && tagName !== 'script' && tagName !== 'noscript';
        },
      };

      // Capture the full element
      const dataUrl = await toPng(elementRef.current, config);

      // If we need to crop to a specific region
      if ((x !== 0 || y !== 0 || width || height) && dataUrl) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });

        // Create a canvas to crop the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const cropWidth = (width || fullWidth) * 2; // Account for pixelRatio
        const cropHeight = (height || fullHeight) * 2;
        const cropX = x * 2;
        const cropY = y * 2;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw the cropped portion
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight, // Source rectangle
          0, 0, cropWidth, cropHeight // Destination rectangle
        );

        // Convert canvas to blob
        const croppedDataUrl = canvas.toDataURL('image/png');

        if (returnDataUrl) {
          return croppedDataUrl;
        }

        // Convert to blob and download - WAIT for it to complete
        await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            try {
              if (!blob) throw new Error('Failed to create blob');
              
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
              
              toast.success('Snapshot saved successfully');
              resolve();
            } catch (err) {
              reject(err);
            }
          }, 'image/png');
        });
      } else {
        // No cropping needed
        if (returnDataUrl) {
          return dataUrl;
        }

        // Convert dataUrl to blob and download
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        if (!blob) throw new Error('Failed to create blob');

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success('Snapshot saved successfully');
      }

    } catch (error) {
      console.error('Snapshot failed:', error);
      toast.error('Failed to save snapshot');
      return null;
    } finally {
      // Always restore the DOM and cleanup
      if (restoreDom) restoreDom();
      elementRef.current?.classList.remove('snapshot-mode');
      setIsSnapshotting(false);
    }
  }, []);

  return { captureSnapshot, isSnapshotting };
};
