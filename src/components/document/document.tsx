import { Component, Prop, State, Watch } from '@stencil/core';
import { slugify } from '../../utils';
import defaultTemplate from './templates/default';
import nativeTemplate from './templates/native';
import apiTemplate from './templates/api';
import cliTemplate from './templates/cli';
import errorTemplate from './templates/error';

@Component({
  tag: 'docs-document',
  styleUrl: 'document.css'
})
export class DocsDocument {
  @Prop() path: string;
  @State() badFetch: Response = null;
  @State() document;

  componentWillLoad() {
    return this.fetchDocument(this.path);
  }

  @Watch('path')
  fetchDocument(path) {
    return fetch(path)
      .then(this.validateFetch)
      .then(this.handleNewDocument)
      .catch(this.handleBadFetch);
  }

  validateFetch = (response) => {
    if (!response.ok) throw response;
    return response.json();
  }

  handleNewDocument = (document) => {
    this.badFetch = null;
    this.document = document;
  }

  handleBadFetch = (error) => {
    this.badFetch = error;
  }

  getPageClass(path: string) {
    const [, doc]: string[] | null = /^\/docs\/documents\/(.+)\.json$/.exec(path) || [];
    return slugify(doc);
  }

  hostData() {
    return {
      class: {
        [`page-${this.getPageClass(this.path)}`]: true
      }
    };
  }

  render() {
    const { document } = this;

    if (this.badFetch) {
      return errorTemplate(this.badFetch);
    }

    const content = [
      <stencil-route-switch>
        <stencil-route url="/docs/native" routeRender={nativeTemplate} componentProps={{ document }}/>
        <stencil-route url="/docs/api/(.+)" routeRender={apiTemplate} componentProps={{ document }}/>
        <stencil-route url="/docs/cli/commands/(.+)" routeRender={cliTemplate} componentProps={{ document }}/>
        <stencil-route url="/docs" routeRender={defaultTemplate} componentProps={{ document }}/>
      </stencil-route-switch>
    ];

    const shouldShowPagination = (
      document.previousText && document.previousUrl || document.nextText && document.nextUrl
    );

    if (shouldShowPagination) {
      content.push(
        <docs-pagination document={document}/>
      );
    }

    return content;
  }
}