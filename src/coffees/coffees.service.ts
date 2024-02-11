import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Coffee } from './entities/coffee.entity';
import { Connection, DataSource, Repository } from 'typeorm';
import { Flavor } from './entities/flavor.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query';
import { Event } from 'src/events/entities/event.entity';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly _repo: Repository<Coffee>,
    @InjectRepository(Coffee)
    private readonly _flavorRepo: Repository<Flavor>,

    private readonly _connection: Connection,

    private _dataSource: DataSource
  ) { }
  async create(createCoffeeDto: CreateCoffeeDto) {
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map(name => this.preloadFlavorByName(name))
    )
    const coffee = this._repo.create({ ...createCoffeeDto, flavors })
    return this._repo.save(coffee)
  }

  findAll(paginationQuery?: PaginationQueryDto) {
    return this._repo.find({
      relations: ['flavors'],
      skip: paginationQuery.offset,
      take: paginationQuery.limit
    })
  }

  async findOne(id: number) {
    return this._repo.findOne({ where: { id }, relations: ['flavors'] },)
  }

  async update(id: number, updateCoffeeDto: UpdateCoffeeDto) {
    const flavors = updateCoffeeDto.flavors && (await Promise.all(
      updateCoffeeDto.flavors.map(name => this.preloadFlavorByName(name))
    ))
    const coffee = await this._repo.preload({ id: +id, ...updateCoffeeDto, flavors })

    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found`)
    }

    return this._repo.save(coffee);
  }

  async remove(id: number) {
    const coffee = await this.findOne(id)
    return this._repo.remove(coffee)
  }
  async removeAll() {
    const coffees = await this.findAll()
    // return coffees
    console.log("🚀 ~ CoffeesService ~ removeAll ~ coffees:", coffees)
    return coffees.map(async ({ id }) => { await this.remove(id as any) })
    // return this._repo.delete()
  }

  private async recommendCoffee(coffee: Coffee) {
    const queryRunner = this._dataSource.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      coffee.recommendations++;

      const recommentEvent = new Event();
      recommentEvent.name = 'coffee-recommendation';
      recommentEvent.type = 'coffee';
      recommentEvent.payload = { coffeeId: coffee.id };

      await queryRunner.manager.save(coffee);
      await queryRunner.manager.save(recommentEvent);

      await queryRunner.commitTransaction()
    } catch (err) {
      await queryRunner.rollbackTransaction()
    } finally {
      await queryRunner.release()
    }
  }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existingFlavor = await this._flavorRepo.findOne({ where: { name } })
    if (existingFlavor) {
      return existingFlavor
    }
    return this._flavorRepo.create({ name })
  }
}
