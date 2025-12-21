import React, { useMemo } from 'react';
import { IconPaths } from '../icons/blockIcons';

interface BlockIconProps {
    type: string;
    className?: string;
    size?: number;
}

/**
 * BlockIcon Component
 * Renders high-quality SVG icons for strategy blocks.
 * Uses currentColor to inherit theme branding.
 */
export const BlockIcon: React.FC<BlockIconProps> = ({ type, className, size = 24 }) => {
    const iconContent = useMemo(() => {
        return IconPaths[type] || null;
    }, [type]);

    if (!iconContent) {
        // Fallback for unknown types or if icon is missing
        return <span className={`fallback-icon ${className || ''}`}>{type.charAt(0).toUpperCase()}</span>;
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`block-icon ${className || ''}`}
            style={{
                display: 'block',
                flexShrink: 0,
                pointerEvents: 'none'
            }}
        >
            {iconContent}
        </svg>
    );
};
