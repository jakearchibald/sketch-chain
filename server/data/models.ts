/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  Sequelize,
  Model,
  STRING,
  INTEGER,
  DATE,
  BOOLEAN,
  TEXT,
  HasManyGetAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  Association,
} from 'sequelize';
import { storageRoot } from '../config';
import {
  Game as SharedGame,
  GameState,
  Player as SharedPlayer,
  TurnType,
  Thread as SharedThread,
  Turn as SharedTurn,
} from 'shared/types';

const sequelize = new Sequelize(`sqlite:${storageRoot}/db.db`);

export class Game extends Model implements SharedGame {
  id!: string;
  state!: GameState;
  endedAt!: Date | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  readonly players?: Player[];
  public getPlayers!: HasManyGetAssociationsMixin<Player>;
  public countPlayers!: HasManyCountAssociationsMixin;
  public createPlayer!: HasManyCreateAssociationMixin<Player>;

  readonly threads?: Thread[];
  public getThreads!: HasManyGetAssociationsMixin<Thread>;
  public countThreads!: HasManyCountAssociationsMixin;
  public createThread!: HasManyCreateAssociationMixin<Thread>;

  public static associations: {
    players: Association<Game, Player>;
    threads: Association<Game, Thread>;
  };
}

Game.init(
  {
    id: { type: STRING, primaryKey: true },
    state: { type: INTEGER, allowNull: false, defaultValue: GameState.Open },
    endedAt: { type: DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'game',
  },
);

export class Player extends Model implements SharedPlayer {
  id!: number;
  gameId!: string;
  userId!: string;
  name!: string;
  avatar!: string | null;
  isAdmin!: boolean;
  leftGame!: boolean;
  order!: number | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
  readonly game?: Game;
}

Player.init(
  {
    userId: { type: STRING, allowNull: false },
    name: { type: STRING, allowNull: false },
    avatar: { type: STRING, allowNull: true },
    isAdmin: { type: BOOLEAN, allowNull: false, defaultValue: false },
    leftGame: { type: BOOLEAN, allowNull: false, defaultValue: false },
    order: { type: INTEGER, allowNull: true },
  },
  {
    sequelize,
    indexes: [{ unique: true, fields: ['gameId', 'userId'] }],
    modelName: 'player',
  },
);

export class Thread extends Model implements SharedThread {
  id!: number;
  turn!: number;
  turnOffset!: number;
  complete!: boolean;
  turnUpdatedAt!: Date | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
  readonly game?: Game;

  readonly turns?: Turn[];
  public getTurns!: HasManyGetAssociationsMixin<Turn>;
  public countTurns!: HasManyCountAssociationsMixin;
  public createTurn!: HasManyCreateAssociationMixin<Turn>;
}

Thread.init(
  {
    turn: { type: INTEGER, allowNull: false, defaultValue: 0 },
    turnOffset: { type: INTEGER, allowNull: false },
    complete: { type: BOOLEAN, allowNull: false, defaultValue: false },
    turnUpdatedAt: { type: DATE, allowNull: true },
  },
  {
    sequelize,
    indexes: [{ unique: true, fields: ['gameId', 'turnOffset'] }],
    modelName: 'thread',
  },
);

export class Turn extends Model implements SharedTurn {
  id!: number;
  threadId!: number;
  type!: TurnType;
  data!: string | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

Turn.init(
  {
    type: { type: INTEGER, allowNull: false },
    data: { type: TEXT, allowNull: true },
  },
  {
    sequelize,
    indexes: [{ unique: true, fields: ['threadId', 'playerId'] }],
    modelName: 'turn',
  },
);

Game.hasMany(Player, { foreignKey: { allowNull: false } });
Player.belongsTo(Game);

Game.hasMany(Thread, { foreignKey: { allowNull: false } });
Thread.belongsTo(Game);

Thread.hasMany(Turn, { foreignKey: { allowNull: false } });
Turn.belongsTo(Thread);
Turn.hasOne(Player, { foreignKey: { allowNull: false } });

sequelize.sync();
