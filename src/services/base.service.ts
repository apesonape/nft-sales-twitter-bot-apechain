import { EventEmitter } from 'events';
import { config } from '../config';

export class BaseService extends EventEmitter {
  protected config = config;

  constructor() {
    super();
  }
} 