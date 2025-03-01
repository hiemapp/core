import DatabaseController from '../lib/DatabaseController';
import Task from './Task';

export default class TaskController extends DatabaseController<Task>() {
    static table = 'tasks';

    static load() {
        return super.load(Task);
    }
}
