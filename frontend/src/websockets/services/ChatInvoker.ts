import type { ICommand } from '../commands/SendMessageCommand';

export class ChatInvoker {
    private commandsHistory: ICommand[] = [];

    public executeCommand(command: ICommand): void {
        command.execute();
        this.commandsHistory.push(command);
    }

    public undoLastCommand(): void {
        const lastCommand = this.commandsHistory.pop();
        if (lastCommand) {
            lastCommand.undo();
        }
    }
}