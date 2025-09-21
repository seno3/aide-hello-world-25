import { ConceptNode } from '../core/telemetry';

// Simple D3 declarations
declare const d3: any;

export class LearningVisualizer {
  private container: HTMLElement;
  private svg: any;
  private width: number = 800;
  private height: number = 600;
  private conceptMap: Map<string, ConceptNode> = new Map();
  private simulation: any = null;
  private nodes: any = null;
  private links: any = null;
  private labels: any = null;

  constructor(containerId: string = 'd3Container') {
    this.container = document.getElementById(containerId) || document.body;
    this.initializeSVG();
    this.setupEventListeners();
  }

  private initializeSVG(): void {
    // Create SVG element
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .style('background', 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event: any) => {
        this.svg.selectAll('g').attr('transform', event.transform);
      });

    this.svg.call(zoom);

    // Create main group for all elements
    this.svg.append('g').attr('class', 'main-group');
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.resize();
    });

    // Initial resize
    this.resize();
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(400, rect.width - 40);
    this.height = Math.max(300, rect.height - 40);

    this.svg
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', `0 0 ${this.width} ${this.height}`);

    if (this.simulation) {
      this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
      this.simulation.alpha(0.3).restart();
    }
  }

  /**
   * Render the initial visualization with mock data
   */
  public render(initialData: ConceptNode[] = []): void {
    // Add some mock data if none provided
    if (initialData.length === 0) {
      initialData = this.generateMockData();
    }

    // Update concept map
    initialData.forEach(concept => {
      this.conceptMap.set(concept.concept, concept);
    });

    this.createVisualization();
  }

  /**
   * Update the visualization with new concepts
   */
  public update(newConcepts: string[]): void {
    // Update concept counts
    newConcepts.forEach(concept => {
      const existing = this.conceptMap.get(concept);
      if (existing) {
        existing.count++;
        existing.lastSeen = new Date().toISOString();
      } else {
        this.conceptMap.set(concept, {
          concept,
          count: 1,
          lastSeen: new Date().toISOString()
        });
      }
    });

    // Recreate visualization with updated data
    this.createVisualization();
  }

  private createVisualization(): void {
    const data = Array.from(this.conceptMap.values());
    
    // Clear existing elements
    this.svg.select('.main-group').selectAll('*').remove();

    if (data.length === 0) {
      this.showEmptyState();
      return;
    }

    // Create force simulation
    this.simulation = d3.forceSimulation(data)
      .force('link', d3.forceLink()
        .id((d: any) => d.concept)
        .distance(100)
        .strength(0.1))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => this.getNodeRadius(d) + 5));

    // Create links (connections between related concepts)
    const linkData = this.generateLinks(data);
    this.links = this.svg.select('.main-group')
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(linkData)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.strength || 1) * 2);

    // Create nodes (concepts)
    this.nodes = this.svg.select('.main-group')
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('r', (d: any) => this.getNodeRadius(d))
      .attr('fill', (d: any) => this.getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(this.dragBehavior())
      .on('click', (event: any, d: any) => this.onNodeClick(event, d))
      .on('mouseover', (event: any, d: any) => this.onNodeHover(event, d))
      .on('mouseout', (event: any, d: any) => this.onNodeLeave(event, d));

    // Add pulsing animation to new/updated nodes
    this.nodes
      .filter((d: any) => this.isRecentlyUpdated(d))
      .transition()
      .duration(1000)
      .attr('r', (d: any) => this.getNodeRadius(d) * 1.3)
      .transition()
      .duration(1000)
      .attr('r', (d: any) => this.getNodeRadius(d));

    // Create labels
    this.labels = this.svg.select('.main-group')
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .text((d: any) => d.concept)
      .attr('font-size', (d: any) => Math.min(14, Math.max(10, this.getNodeRadius(d) * 0.8)))
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Add tooltip
    this.createTooltip();

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      if (this.links) {
        this.links
          .attr('x1', (d: any) => d.source.x || 0)
          .attr('y1', (d: any) => d.source.y || 0)
          .attr('x2', (d: any) => d.target.x || 0)
          .attr('y2', (d: any) => d.target.y || 0);
      }

      if (this.nodes) {
        this.nodes
          .attr('cx', (d: any) => d.x || 0)
          .attr('cy', (d: any) => d.y || 0);
      }

      if (this.labels) {
        this.labels
          .attr('x', (d: any) => d.x || 0)
          .attr('y', (d: any) => d.y || 0);
      }
    });

    // Add title
    this.addTitle();
  }

  private generateLinks(data: ConceptNode[]): any[] {
    const links: any[] = [];
    
    // Create connections between related concepts
    const conceptRelations = {
      'async-await': ['promises', 'error-handling', 'performance'],
      'react-hooks': ['useeffect', 'usestate', 'performance'],
      'sql-security': ['database', 'security', 'parameterized-queries'],
      'performance': ['debounce', 'throttle', 'optimization'],
      'security': ['sql-injection', 'authentication', 'authorization'],
      'error-handling': ['try-catch', 'promises', 'async-await'],
      'javascript-basics': ['equality', 'null-safety', 'typescript']
    };

    data.forEach(source => {
      const related = conceptRelations[source.concept as keyof typeof conceptRelations] || [];
      related.forEach(targetConcept => {
        const target = data.find(d => d.concept === targetConcept);
        if (target) {
          links.push({
            source: source.concept,
            target: target.concept,
            strength: Math.min(source.count, target.count) / Math.max(source.count, target.count)
          });
        }
      });
    });

    return links;
  }

  private getNodeRadius(d: ConceptNode): number {
    // Base radius on count, with minimum and maximum bounds
    return Math.min(30, Math.max(8, Math.sqrt(d.count) * 3));
  }

  private getNodeColor(d: ConceptNode): string {
    // Color based on concept category
    const colors = {
      'async-await': '#e74c3c',
      'react-hooks': '#3498db',
      'sql-security': '#e67e22',
      'performance': '#2ecc71',
      'security': '#9b59b6',
      'error-handling': '#f39c12',
      'javascript-basics': '#1abc9c'
    };

    // Find matching color or use default
    for (const [key, color] of Object.entries(colors)) {
      if (d.concept.includes(key) || key.includes(d.concept)) {
        return color;
      }
    }

    // Default color based on count
    const intensity = Math.min(1, d.count / 10);
    return d3.interpolateBlues(intensity);
  }

  private isRecentlyUpdated(d: ConceptNode): boolean {
    const lastSeen = new Date(d.lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    return diffMinutes < 5; // Updated in last 5 minutes
  }

  private dragBehavior(): any {
    return d3.drag()
      .on('start', (event: any, d: any) => {
        if (!event.active && this.simulation) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: any) => {
        if (!event.active && this.simulation) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  private onNodeClick(event: any, d: ConceptNode): void {
    // Add click animation
    d3.select(event.currentTarget)
      .transition()
      .duration(200)
      .attr('r', this.getNodeRadius(d) * 1.2)
      .transition()
      .duration(200)
      .attr('r', this.getNodeRadius(d));

    // Show concept details (could open a modal or send message to extension)
    this.showConceptDetails(d);
  }

  private onNodeHover(event: any, d: ConceptNode): void {
    // Highlight connected nodes
    if (this.links && this.nodes) {
      this.links.style('stroke-opacity', (l: any) => {
        return (l.source === d || l.target === d) ? 1 : 0.1;
      });

      this.nodes.style('opacity', (n: any) => {
        return (n === d || this.isConnected(n, d)) ? 1 : 0.3;
      });
    }

    // Show tooltip
    this.showTooltip(event, d);
  }

  private onNodeLeave(event: any, d: ConceptNode): void {
    // Reset highlighting
    if (this.links && this.nodes) {
      this.links.style('stroke-opacity', 0.6);
      this.nodes.style('opacity', 1);
    }

    // Hide tooltip
    this.hideTooltip();
  }

  private isConnected(node1: ConceptNode, node2: ConceptNode): boolean {
    // Check if two nodes are connected (simplified)
    const conceptRelations = {
      'async-await': ['promises', 'error-handling'],
      'react-hooks': ['useeffect', 'usestate'],
      'sql-security': ['database', 'security'],
      'performance': ['debounce', 'throttle']
    };

    const related = conceptRelations[node1.concept as keyof typeof conceptRelations] || [];
    return related.includes(node2.concept) || node1.concept === node2.concept;
  }

  private createTooltip(): void {
    // Tooltip will be created dynamically
  }

  private showTooltip(event: any, d: ConceptNode): void {
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'concept-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('opacity', 0);

    tooltip.html(`
      <strong>${d.concept}</strong><br/>
      Count: ${d.count}<br/>
      Last seen: ${new Date(d.lastSeen).toLocaleString()}
    `);

    tooltip.transition()
      .duration(200)
      .style('opacity', 1);

    tooltip.style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  private hideTooltip(): void {
    d3.selectAll('.concept-tooltip').remove();
  }

  private showConceptDetails(d: ConceptNode): void {
    // Create a modal or detailed view
    const modal = d3.select('body')
      .append('div')
      .attr('class', 'concept-modal')
      .style('position', 'fixed')
      .style('top', '0')
      .style('left', '0')
      .style('width', '100%')
      .style('height', '100%')
      .style('background', 'rgba(0, 0, 0, 0.5)')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('z-index', '2000')
      .style('opacity', 0);

    const content = modal.append('div')
      .style('background', 'white')
      .style('padding', '20px')
      .style('border-radius', '8px')
      .style('max-width', '400px')
      .style('width', '90%');

    content.html(`
      <h3>${d.concept}</h3>
      <p><strong>Learning Count:</strong> ${d.count}</p>
      <p><strong>Last Encountered:</strong> ${new Date(d.lastSeen).toLocaleString()}</p>
      <p><strong>Learning Level:</strong> ${this.getLearningLevel(d.count)}</p>
      <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    `);

    modal.transition()
      .duration(200)
      .style('opacity', 1);

    // Close on background click
    modal.on('click', function(event: any) {
      if (event.target === this) {
        d3.select(this).remove();
      }
    });
  }

  private getLearningLevel(count: number): string {
    if (count >= 10) return 'Expert';
    if (count >= 5) return 'Advanced';
    if (count >= 3) return 'Intermediate';
    if (count >= 1) return 'Beginner';
    return 'New';
  }

  private addTitle(): void {
    this.svg.select('.main-group')
      .append('text')
      .attr('x', this.width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .attr('fill', '#495057')
      .text('Learning DNA Spiral');
  }

  private showEmptyState(): void {
    this.svg.select('.main-group')
      .append('text')
      .attr('x', this.width / 2)
      .attr('y', this.height / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', '#6c757d')
      .text('Start learning to see your knowledge map!');
  }

  private generateMockData(): ConceptNode[] {
    return [
      { concept: 'async-await', count: 5, lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
      { concept: 'react-hooks', count: 3, lastSeen: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      { concept: 'sql-security', count: 2, lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { concept: 'performance', count: 4, lastSeen: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { concept: 'error-handling', count: 1, lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() }
    ];
  }

  /**
   * Export the visualization as SVG
   */
  public exportSVG(): string {
    return this.svg.node()?.outerHTML || '';
  }

  /**
   * Clear the visualization
   */
  public clear(): void {
    this.conceptMap.clear();
    this.svg.select('.main-group').selectAll('*').remove();
    this.showEmptyState();
  }
}

// Initialize visualizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('d3Container');
  if (container) {
    window.visualizer = new LearningVisualizer();
    window.visualizer.render();
  }
});

// Make visualizer globally available
declare global {
  interface Window {
    visualizer: any;
  }
}
