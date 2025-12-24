'use client';
import { useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Category } from '@/types';

export default function CategoryFlowView({ categories }: { categories: Category[] }) {
    const { nodes, edges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        let y = 0;

        categories.forEach((cat, index) => {
            const catId = cat.id || `cat-${index}`;
            const subCount = cat.subcategories?.length || 0;
            const heightNeeded = Math.max(100, subCount * 60);

            // Category Node
            nodes.push({
                id: catId,
                data: { label: cat.name },
                position: { x: 0, y: y + (heightNeeded / 2) - 25 },
                style: {
                    background: cat.type === 'expense' ? '#ffebee' : '#e8f5e9',
                    border: '1px solid #777',
                    fontWeight: 'bold',
                    width: 150
                }
            });

            // Subcategories
            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach((sub, subIndex) => {
                    const subId = `${catId}-sub-${subIndex}`;
                    nodes.push({
                        id: subId,
                        data: { label: sub },
                        position: { x: 300, y: y + (subIndex * 60) },
                        style: { width: 150, fontSize: 12 }
                    });

                    edges.push({
                        id: `e-${catId}-${subId}`,
                        source: catId,
                        target: subId,
                        type: 'smoothstep'
                    });
                });
            }
            y += heightNeeded + 20; // Gap
        });

        return { nodes, edges };
    }, [categories]);

    return (
        <div style={{ height: '70vh', border: '1px solid #e0e0e0', borderRadius: 8 }}>
            <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background color="#aaa" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
