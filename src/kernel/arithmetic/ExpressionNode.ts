/**
 * 表达式节点
 * 对应 Java 版本的 kernel/arithmetic/ExpressionNode
 * 
 * 用于构建和计算数学表达式树
 */

export enum Operation {
  NO_OPERATION = 0,
  PLUS = 1,
  MINUS = 2,
  MULTIPLY = 3,
  DIVIDE = 4,
  POWER = 5,
  FUNCTION = 6,
  NEGATE = 7,
  EQUAL_BOOLEAN = 8,
  NOT_EQUAL = 9,
  LESS = 10,
  GREATER = 11,
  LESS_EQUAL = 12,
  GREATER_EQUAL = 13,
  AND = 14,
  OR = 15,
  NOT = 16,
  ABS = 17,
  SQRT = 18,
  SIN = 19,
  COS = 20,
  TAN = 21,
  ASIN = 22,
  ACOS = 23,
  ATAN = 24,
  LOG = 25,
  LN = 26,
  EXP = 27,
  FLOOR = 28,
  CEIL = 29,
  ROUND = 30,
  SIGN = 31,
  FACTORIAL = 32,
}

export type ExpressionValue = number | string | ExpressionNode | null;

export class ExpressionNode {
  private left: ExpressionValue;
  private right: ExpressionValue;
  private operation: Operation;

  constructor(left: ExpressionValue = null, operation: Operation = Operation.NO_OPERATION, right: ExpressionValue = null) {
    this.left = left;
    this.operation = operation;
    this.right = right;
  }

  getLeft(): ExpressionValue {
    return this.left;
  }

  setLeft(value: ExpressionValue): void {
    this.left = value;
  }

  getRight(): ExpressionValue {
    return this.right;
  }

  setRight(value: ExpressionValue): void {
    this.right = value;
  }

  getOperation(): Operation {
    return this.operation;
  }

  setOperation(op: Operation): void {
    this.operation = op;
  }

  isLeaf(): boolean {
    return this.operation === Operation.NO_OPERATION;
  }

  isNumber(): boolean {
    return typeof this.left === 'number' && this.isLeaf();
  }

  getNumber(): number {
    if (typeof this.left === 'number') {
      return this.left;
    }
    return NaN;
  }

  evaluate(variables: Map<string, number> = new Map()): number {
    if (this.isLeaf()) {
      if (typeof this.left === 'number') {
        return this.left;
      }
      if (typeof this.left === 'string') {
        const value = variables.get(this.left);
        if (value !== undefined) {
          return value;
        }
        if (this.left === 'pi' || this.left === 'π') {
          return Math.PI;
        }
        if (this.left === 'e') {
          return Math.E;
        }
        return NaN;
      }
      if (this.left instanceof ExpressionNode) {
        return this.left.evaluate(variables);
      }
      return NaN;
    }

    const leftVal = this.getValue(this.left, variables);
    const rightVal = this.getValue(this.right, variables);

    switch (this.operation) {
      case Operation.PLUS:
        return leftVal + rightVal;
      case Operation.MINUS:
        return leftVal - rightVal;
      case Operation.MULTIPLY:
        return leftVal * rightVal;
      case Operation.DIVIDE:
        return rightVal !== 0 ? leftVal / rightVal : NaN;
      case Operation.POWER:
        return Math.pow(leftVal, rightVal);
      case Operation.NEGATE:
        return -leftVal;
      case Operation.ABS:
        return Math.abs(leftVal);
      case Operation.SQRT:
        return Math.sqrt(leftVal);
      case Operation.SIN:
        return Math.sin(leftVal);
      case Operation.COS:
        return Math.cos(leftVal);
      case Operation.TAN:
        return Math.tan(leftVal);
      case Operation.ASIN:
        return Math.asin(leftVal);
      case Operation.ACOS:
        return Math.acos(leftVal);
      case Operation.ATAN:
        return Math.atan(leftVal);
      case Operation.LOG:
        return Math.log10(leftVal);
      case Operation.LN:
        return Math.log(leftVal);
      case Operation.EXP:
        return Math.exp(leftVal);
      case Operation.FLOOR:
        return Math.floor(leftVal);
      case Operation.CEIL:
        return Math.ceil(leftVal);
      case Operation.ROUND:
        return Math.round(leftVal);
      case Operation.SIGN:
        return Math.sign(leftVal);
      case Operation.FACTORIAL:
        return this.factorial(Math.floor(leftVal));
      case Operation.EQUAL_BOOLEAN:
        return leftVal === rightVal ? 1 : 0;
      case Operation.NOT_EQUAL:
        return leftVal !== rightVal ? 1 : 0;
      case Operation.LESS:
        return leftVal < rightVal ? 1 : 0;
      case Operation.GREATER:
        return leftVal > rightVal ? 1 : 0;
      case Operation.LESS_EQUAL:
        return leftVal <= rightVal ? 1 : 0;
      case Operation.GREATER_EQUAL:
        return leftVal >= rightVal ? 1 : 0;
      case Operation.AND:
        return (leftVal !== 0 && rightVal !== 0) ? 1 : 0;
      case Operation.OR:
        return (leftVal !== 0 || rightVal !== 0) ? 1 : 0;
      case Operation.NOT:
        return leftVal === 0 ? 1 : 0;
      default:
        return NaN;
    }
  }

  private getValue(value: ExpressionValue, variables: Map<string, number>): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const v = variables.get(value);
      return v !== undefined ? v : NaN;
    }
    if (value instanceof ExpressionNode) {
      return value.evaluate(variables);
    }
    return NaN;
  }

  private factorial(n: number): number {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  toString(): string {
    if (this.isLeaf()) {
      return String(this.left);
    }

    const leftStr = this.nodeToString(this.left);
    const rightStr = this.nodeToString(this.right);

    switch (this.operation) {
      case Operation.PLUS:
        return `(${leftStr} + ${rightStr})`;
      case Operation.MINUS:
        return `(${leftStr} - ${rightStr})`;
      case Operation.MULTIPLY:
        return `(${leftStr} * ${rightStr})`;
      case Operation.DIVIDE:
        return `(${leftStr} / ${rightStr})`;
      case Operation.POWER:
        return `(${leftStr} ^ ${rightStr})`;
      case Operation.NEGATE:
        return `(-${leftStr})`;
      case Operation.ABS:
        return `abs(${leftStr})`;
      case Operation.SQRT:
        return `sqrt(${leftStr})`;
      case Operation.SIN:
        return `sin(${leftStr})`;
      case Operation.COS:
        return `cos(${leftStr})`;
      case Operation.TAN:
        return `tan(${leftStr})`;
      case Operation.ASIN:
        return `asin(${leftStr})`;
      case Operation.ACOS:
        return `acos(${leftStr})`;
      case Operation.ATAN:
        return `atan(${leftStr})`;
      case Operation.LOG:
        return `log(${leftStr})`;
      case Operation.LN:
        return `ln(${leftStr})`;
      case Operation.EXP:
        return `exp(${leftStr})`;
      case Operation.FLOOR:
        return `floor(${leftStr})`;
      case Operation.CEIL:
        return `ceil(${leftStr})`;
      case Operation.ROUND:
        return `round(${leftStr})`;
      case Operation.SIGN:
        return `sign(${leftStr})`;
      case Operation.FACTORIAL:
        return `${leftStr}!`;
      default:
        return `?`;
    }
  }

  private nodeToString(node: ExpressionValue): string {
    if (node === null) return '';
    if (typeof node === 'number' || typeof node === 'string') {
      return String(node);
    }
    return node.toString();
  }

  copy(): ExpressionNode {
    const copyLeft = this.left instanceof ExpressionNode ? this.left.copy() : this.left;
    const copyRight = this.right instanceof ExpressionNode ? this.right.copy() : this.right;
    return new ExpressionNode(copyLeft, this.operation, copyRight);
  }

  getVariables(): Set<string> {
    const vars = new Set<string>();
    this.collectVariables(vars);
    return vars;
  }

  private collectVariables(vars: Set<string>): void {
    if (typeof this.left === 'string') {
      vars.add(this.left);
    } else if (this.left instanceof ExpressionNode) {
      this.left.collectVariables(vars);
    }

    if (typeof this.right === 'string') {
      vars.add(this.right);
    } else if (this.right instanceof ExpressionNode) {
      this.right.collectVariables(vars);
    }
  }

  static number(value: number): ExpressionNode {
    return new ExpressionNode(value);
  }

  static variable(name: string): ExpressionNode {
    return new ExpressionNode(name);
  }

  static add(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
    return new ExpressionNode(left, Operation.PLUS, right);
  }

  static subtract(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
    return new ExpressionNode(left, Operation.MINUS, right);
  }

  static multiply(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
    return new ExpressionNode(left, Operation.MULTIPLY, right);
  }

  static divide(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
    return new ExpressionNode(left, Operation.DIVIDE, right);
  }

  static power(base: ExpressionNode, exponent: ExpressionNode): ExpressionNode {
    return new ExpressionNode(base, Operation.POWER, exponent);
  }

  static negate(node: ExpressionNode): ExpressionNode {
    return new ExpressionNode(node, Operation.NEGATE);
  }

  static sin(node: ExpressionNode): ExpressionNode {
    return new ExpressionNode(node, Operation.SIN);
  }

  static cos(node: ExpressionNode): ExpressionNode {
    return new ExpressionNode(node, Operation.COS);
  }

  static tan(node: ExpressionNode): ExpressionNode {
    return new ExpressionNode(node, Operation.TAN);
  }

  static sqrt(node: ExpressionNode): ExpressionNode {
    return new ExpressionNode(node, Operation.SQRT);
  }

  static abs(node: ExpressionNode): ExpressionNode {
    return new ExpressionNode(node, Operation.ABS);
  }

  static ln(node: ExpressionNode): ExpressionNode {
    return new ExpressionNode(node, Operation.LN);
  }

  static exp(node: ExpressionNode): ExpressionNode {
    return new ExpressionNode(node, Operation.EXP);
  }
}
