import EventEmitter from 'tiny-emitter';
import { Selection } from '@recogito/recogito-client-core';
import { parseFragment } from '../annotations/AnnotationUtils';
import { SVG_NAMESPACE } from '../SVGConst';
import { DraggableRect } from './Rectangle';

import './RectDragSelector.scss';

/** Renders an SVG rectangle shape **/
const drawRect = (x, y, w, h) => {
  const g = document.createElementNS(SVG_NAMESPACE, 'g');

  const outerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');
  const innerRect  = document.createElementNS(SVG_NAMESPACE, 'rect');

  innerRect.setAttribute('class', 'inner');
  innerRect.setAttribute('x', x + 0.5);
  innerRect.setAttribute('y', y + 0.5);
  innerRect.setAttribute('width', w - 1);
  innerRect.setAttribute('height',  h - 1);

  outerRect.setAttribute('class', 'outer');
  outerRect.setAttribute('x', x - 0.5);
  outerRect.setAttribute('y', y - 0.5);
  outerRect.setAttribute('width', w + 1);
  outerRect.setAttribute('height',  h + 1);

  g.appendChild(outerRect);
  g.appendChild(innerRect);

  return g;
}

/** TODO roll all this into a class (in a separate source file) **/
const toSelection = g => {
  const outerRect = g.querySelector('.outer');

  const x = outerRect.getAttribute('x');
  const y = outerRect.getAttribute('y');
  const w = outerRect.getAttribute('width');
  const h = outerRect.getAttribute('height');

  return new Selection([{
    "type": "FragmentSelector",
    "conformsTo": "http://www.w3.org/TR/media-frags/",
    "value": `xywh=pixel:${x},${y},${w},${h}`
  }]);
}

/*
export class Rectangle extends EventEmitter {

  constructor(annotation, svg) {
    super();  

    const fragment = parseFragment(annotation);
    const { x, y, w, h } =  fragment;

    const g = drawRect(x, y, w, h);
    g.setAttribute('class', 'a9s-annotation');
    g.setAttribute('data-id', annotation.id);
    g.annotation = annotation;
  
    svg.appendChild(g);

    const bounds = g.getBoundingClientRect();

    g.addEventListener('click', evt => { 
      evt.stopPropagation();
      this.emit('click', { bounds })
    });

    g.addEventListener('mouseover', evt => this.emit('mouseover', evt));
  }

}
*/

export class RectDragSelector extends EventEmitter {

  constructor(svg) {
    super();

    this.svg = svg;
    this.shape = null;
  }

  _attachListeners = () => {
    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);
  }

  _detachListeners = () => {
    this.svg.removeEventListener('mousemove', this.onMouseMove);
    this.svg.removeEventListener('mouseup', this.onMouseUp);
  }

  startDrawing = evt => {
    this._attachListeners();
    this.shape = new DraggableRect([ evt.offsetX, evt.offsetY ], this.svg);
  }

  clear = () => {
    if (this.shape) {
      this.shape.destroy();
      this.shape = null;
    }
  }

  // TODO make this work in all four quadrants
  onMouseMove = evt =>
    this.shape.dragTo(evt.offsetX, evt.offsetY);

  // TODO handle mouseup outside of layer
  onMouseUp = evt => {
    this._detachListeners();

    const { w } = this.shape.bbox;

    if (w > 3) {
      this.emit('complete', { 
        selection: this.shape.toSelection(),
        bounds: this.shape.svg.getBoundingClientRect()
      });
    } else {
      this.clear();
      this.emit('cancel', evt);
    }
  }

}