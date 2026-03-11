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
    const lowerCaseMessage = message.toLowerCase();
    const containsBadWord = this.badWords.some((word) =>
      lowerCaseMessage.includes(word.toLowerCase()),
    );

    if (containsBadWord) {
      throw new Error('Message contains inappropriate language');
    }
  }
}

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
