import { describe, it, expect, vi } from 'vitest';
import {Element} from "../../src";

// test element factory
const div = (children: Array<Element | string> = [], props: Record<string, any> = {}) => new Element(children, props, 'div');

describe ('Element Tests', () => {
    it('Element Constructor create proper element', () => {
        const element = div(['Hello World'], {id: 'test-div'});
        expect(element.tagName).toBe('div');
        expect(element.props).contains({ id: 'test-div' });
        expect(element.children).toEqual(['Hello World']);
    });

    it('Element works without props', () => {
        const element = div(['No Props']);
        expect(element.tagName).toBe('div');
        expect(element.props).toEqual({});
        expect(element.children).toEqual(['No Props']);
    });

    it('Element works without children', () => {
        const element = div([], {className: 'empty-div'});
        expect(element.tagName).toBe('div');
        expect(element.props).contains({ className: 'empty-div' });
        expect(element.children).toEqual([]);
    });

    it('Element works without children and props', () => {
        const element = div();
        expect(element.tagName).toBe('div');
        expect(element.props).toEqual({});
        expect(element.children).toEqual([]);
    });

    it('Element load event gets called', () => {
        const mockLoad = vi.fn();
        div([], { events: { load: mockLoad} });
        expect(mockLoad).toHaveBeenCalled();
    });

    it('Element render creates proper HTMLElement', () => {
        const element = div(['Rendered Content'], { id: 'rendered-div', className: 'rendered-class' });
        const rendered = element.render();
        expect(rendered.tagName.toLowerCase()).toBe('div');
        expect(rendered.id).toBe('rendered-div');
        expect(rendered.className).toBe('rendered-class');
        expect(rendered.textContent).toBe('Rendered Content');
    });


});
