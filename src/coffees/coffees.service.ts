import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Coffee } from './entities/coffee.entity';
import { Repository } from 'typeorm';
import { Flavor } from './entities/flavor.entity';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly _repo: Repository<Coffee>,
    @InjectRepository(Coffee)
    private readonly _flavorRepo: Repository<Flavor>
  ) { }
  async create(createCoffeeDto: CreateCoffeeDto) {
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map(name => this.preloadFlavorByName(name))
    )
    const coffee = this._repo.create({ ...createCoffeeDto, flavors })
    return this._repo.save(coffee)
  }

  findAll() {
    return this._repo.find({ relations: ['flavors'] })
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


  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existingFlavor = await this._flavorRepo.findOne({ where: { name } })
    if (existingFlavor) {
      return existingFlavor
    }
    return this._flavorRepo.create({ name })
  }
}
