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

export const enum GameState {
  Open,
  Playing,
  Complete,
}

const sequelize = new Sequelize(`sqlite:${storageRoot}/db.db`);

export class Game extends Model {
  id!: string;
  state!: GameState;
  turn!: number;
  endedAt!: Date | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
  readonly gamePlayers?: GamePlayer[];

  public getGamePlayers!: HasManyGetAssociationsMixin<GamePlayer>; // Note the null assertions!
  public countGamePlayers!: HasManyCountAssociationsMixin;
  public createGamePlayer!: HasManyCreateAssociationMixin<GamePlayer>;

  public static associations: {
    gamePlayers: Association<Game, GamePlayer>;
  };
}

Game.init(
  {
    id: { type: STRING, primaryKey: true },
    state: { type: INTEGER, allowNull: false, defaultValue: GameState.Open },
    endedAt: { type: DATE, allowNull: true },
    turn: { type: INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    indexes: [{ fields: ['endedAt'] }, { fields: ['createdAt'] }],
    modelName: 'game',
  },
);

export class GamePlayer extends Model {
  gameId!: string;
  userId!: string;
  name!: string;
  avatar!: string | null;
  isAdmin!: boolean;
  order!: number | null;
  turnData!: string | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
  readonly game?: Game;
}

GamePlayer.init(
  {
    userId: { type: STRING, allowNull: false },
    name: { type: STRING, allowNull: false },
    avatar: { type: STRING, allowNull: true },
    isAdmin: { type: BOOLEAN, allowNull: false, defaultValue: false },
    order: { type: INTEGER, allowNull: true },
    turnData: { type: TEXT, allowNull: true },
  },
  {
    sequelize,
    indexes: [
      { unique: true, fields: ['gameId', 'userId'] },
      { unique: true, fields: ['gameId', 'order'] },
      { fields: ['userId'] },
    ],
    modelName: 'gamePlayer',
  },
);

Game.hasMany(GamePlayer, { foreignKey: { allowNull: false } });
GamePlayer.belongsTo(Game);

sequelize.sync();
