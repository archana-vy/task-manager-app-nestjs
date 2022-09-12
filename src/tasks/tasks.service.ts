import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { Task } from './task.entity';
import { TaskStatus } from "./task-status.enum";

@Injectable()
export class TasksService {

    constructor(
        @InjectRepository(Task) private taskRepository: Repository<Task>
    ) {}

    async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
        const { status, search } = filterDto;

        const query = this.taskRepository.createQueryBuilder('task');

        if(status) {
            query.andWhere('task.status = :status', { status });
        }

        if(search) {
            query.andWhere(
                '(task.title LIKE :search OR task.description LIKE :search)', 
                {search: `%${search}%`}
            );
        }

        const tasks = await query.getMany();

        return tasks;
    }

    async getTaskById(id: number): Promise<Task> {
        const found = await this.taskRepository.findOneBy({id});

        if(!found) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }

        return found;
    }

    async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
        const { title, description } = createTaskDto;

        const task = new Task();

        task.title = title;
        task.description = description;
        task.status = TaskStatus.OPEN;

        await task.save();

        return task;
    }

    async updateTaskStatus(id : number, status : TaskStatus) : Promise<Task> {
        const task: Task = await this.getTaskById(id);

        task.status = status;

        await task.save();

        return task;
    }

    async deleteTask(id : number) : Promise<void> {
        const result = await this.taskRepository.delete(id);

        if(result.affected === 0) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }
    }
}
