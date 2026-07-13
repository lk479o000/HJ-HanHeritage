import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('menus')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Get('tree')
  findTree() {
    return this.menuService.findTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Roles('SYS_ADMIN')
  @Post()
  create(
    @Body('name') name: string,
    @Body('icon') icon?: string,
    @Body('parentId') parentId?: number,
    @Body('path') path?: string,
    @Body('linkId') linkId?: string,
    @Body('component') component?: string,
    @Body('sort') sort?: number,
    @Body('type') type?: string,
    @Body('perms') perms?: string,
    @Body('status') status?: number,
  ) {
    return this.menuService.create({ name, icon, parentId, path: path ?? linkId, component, sort, type: type || 'menu', perms, status });
  }

  @Roles('SYS_ADMIN')
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('icon') icon?: string,
    @Body('parentId') parentId?: number,
    @Body('path') path?: string,
    @Body('linkId') linkId?: string,
    @Body('component') component?: string,
    @Body('sort') sort?: number,
    @Body('type') type?: string,
    @Body('perms') perms?: string,
    @Body('status') status?: number,
  ) {
    return this.menuService.update(id, { name, icon, parentId, path: path ?? linkId, component, sort, type, perms, status });
  }

  @Roles('SYS_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
