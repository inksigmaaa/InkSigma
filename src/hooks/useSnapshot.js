import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '@/contexts/ToastContext';

export const useSnapshot = () => {
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const { showToast } = useToast();

  const captureSnapshot = useCallback(async (elementRef, title = 'blog-snapshot', options = {}) => {
    if (!elementRef.current) return;

    const { returnDataUrl = false, height = null, width = null, x = 0, y = 0 } = options;

    try {
      setIsSnapshotting(true);
      
      // Add a class to hide elements during capture if needed
      elementRef.current.classList.add('snapshot-mode');

      const config = {
        scale: 2, // Higher quality
        useCORS: true, // Allow cross-origin images
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: window.innerWidth, // Use full window width to ensure media queries are correct
        windowHeight: window.innerHeight,
        x: x, 
        y: y,
        width: width || elementRef.current.scrollWidth,
        height: height || elementRef.current.scrollHeight,
        scrollX: 0,
        scrollY: -y, // Offset scroll to match capture area
      };

      const canvas = await html2canvas(elementRef.current, config);

      elementRef.current.classList.remove('snapshot-mode');

      if (returnDataUrl) {
        return canvas.toDataURL('image/png');
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        showToast('Snapshot saved successfully', 'success-dark');
      }, 'image/png');

    } catch (error) {
      console.error('Snapshot failed:', error);
      showToast('Failed to save snapshot', 'error');
      return null;
    } finally {
      setIsSnapshotting(false);
    }
  }, [showToast]);

  return { captureSnapshot, isSnapshotting };
};
