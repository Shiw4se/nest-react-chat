class MessageHandler {
  private next: MessageHandler | null = null;

  setNext(handler: MessageHandler): MessageHandler {
    this.next = handler;
    return handler;
  }

  handle(message: string): void {
    if (this.next) {
      this.next.handle(message);
    }
  }
}

class EmptyMessageHandler extends MessageHandler {
  handle(message: string): void {
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }
    super.handle(message);
  }
}



class ProfanityHandler extends MessageHandler {
  private badWords: string[];

  constructor(badWords: string[] = []) {
    super();
    this.badWords = badWords;
  }

  handle(message: string): void {
    const lower = message.toLowerCase();
    const found = this.badWords.find((word) => lower.includes(word.toLowerCase()));
    if (found) {
      throw new Error('Message contains inappropriate language');
    }
    super.handle(message);
  }
}

export class MessageValidationChain {
  private head: MessageHandler;

  constructor(badWords: string[] = []) {
    const empty = new EmptyMessageHandler();
    const profanity = new ProfanityHandler(badWords);

    this.head = empty;
    empty.setNext(profanity);
  }

  validate(message: string): void {
    this.head.handle(message);
  }
}


export interface ValidationStrategy {
  validate(message: string): void;
}

export class BasicValidator implements ValidationStrategy {
  validate(message: string): void {
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }
  }
}

export class FilterValidator implements ValidationStrategy {
  private badWords: string[];

  constructor(badWords: string[]) {
    this.badWords = badWords;
  }

  validate(message: string): void {
    const lower = message.toLowerCase();
    const found = this.badWords.some((word) => lower.includes(word.toLowerCase()));
    if (found) {
      throw new Error('Message contains inappropriate language');
    }
  }
}

/** @deprecated MessageValidationChain */
export class MessageValidatorContext {
  private strategy: ValidationStrategy;

  constructor(strategy: ValidationStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: ValidationStrategy): void {
    this.strategy = strategy;
  }

  validate(message: string): void {
    this.strategy.validate(message);
  }
}